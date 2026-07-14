import fs from 'fs';
import path from 'path';
import { init, parse } from 'es-module-lexer';
import MagicString from 'magic-string';
import { build } from 'esbuild';

import { Resolver, parseSpecifier } from './resolver/index.js';
import { DependencyGraph } from './graph/index.js';
import { ModuleNode } from './graph/moduleNode.js';
import { transformJsx } from '@ray/transform';

export { Resolver } from './resolver/index.js';
export { DependencyGraph } from './graph/index.js';
export { ModuleNode } from './graph/moduleNode.js';

export class RayCore {
  resolver: Resolver;
  graph: DependencyGraph;
  projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.resolver = new Resolver(projectRoot);
    this.graph = new DependencyGraph();
  }

  /**
   * Resolves any import specifier to its unique absolute identifier (file path).
   */
  resolve(specifier: string, importer: string): string {
    // Relative imports (e.g. ./App.jsx, ../utils.js)
    if (specifier.startsWith('.') || specifier.startsWith('..')) {
      return path.resolve(path.dirname(importer), specifier);
    }
    // Absolute project-root imports (e.g. /src/main.jsx)
    if (specifier.startsWith('/')) {
      if (specifier.startsWith('/@modules/')) {
        const bareSpec = specifier.slice('/@modules/'.length);
        return this.resolver.resolveBarePackage(bareSpec, this.projectRoot);
      }
      // Remove leading slash to resolve relative to project root
      return path.join(this.projectRoot, specifier.slice(1));
    }
    // Bare package imports (e.g. react, react-dom/client)
    return this.resolver.resolveBarePackage(specifier, path.dirname(importer));
  }

  /**
   * Registers a module in the dependency graph.
   */
  registerModule(id: string, file: string, url: string): ModuleNode {
    return this.graph.registerModule(id, file, url);
  }

  /**
   * Updates a module's dependencies in the graph.
   */
  updateDependencies(nodeId: string, depIds: Set<string>): void {
    this.graph.updateDependencies(nodeId, depIds, (depId) => {
      let depUrl = '';
      if (depId.includes('node_modules')) {
        const idx = depId.indexOf('node_modules');
        const rel = depId.slice(idx + 'node_modules/'.length).replace(/\\/g, '/');
        depUrl = `/@modules/${rel}`;
      } else {
        depUrl = '/' + path.relative(this.projectRoot, depId).replace(/\\/g, '/');
      }
      return { file: depId, url: depUrl };
    });
  }

  getImporters(id: string): Set<string> {
    return this.graph.getImporters(id);
  }

  getDependencies(id: string): Set<string> {
    return this.graph.getDependencies(id);
  }

  invalidate(id: string): void {
    this.graph.invalidate(id);
  }

  /**
   * Transforms a file by compiling JSX/TS code (if applicable) and rewriting 
   * imports to target absolute paths/virtual module paths.
   * Re-builds the dependency graph incrementally.
   */
  async transform(code: string, file: string): Promise<string> {
    await init;

    const ext = path.extname(file);
    const isTransformable = ['.jsx', '.tsx', '.ts'].includes(ext);

    // 1. Compile JSX/TS
    let jsCode = code;
    if (isTransformable) {
      jsCode = await transformJsx(code, file);
    }

    // 2. Rewrite import specifiers
    const [imports] = parse(jsCode);
    const s = new MagicString(jsCode);
    const depIds = new Set<string>();

    for (const imp of imports) {
      if (imp.n) {
        const specifier = imp.n;

        // Skip absolute URLs
        if (/^(https?|data|blob):/.test(specifier)) {
          continue;
        }

        let rewrittenSpecifier = specifier;
        try {
          const resolvedPath = this.resolve(specifier, file);
          depIds.add(resolvedPath);

          const isCss = resolvedPath.endsWith('.css');

          if (resolvedPath.includes('node_modules')) {
            // Rewrite bare module imports to the virtual /@modules/ path
            rewrittenSpecifier = `/@modules/${specifier}${isCss ? '?import' : ''}`;
          } else {
            // Rewrite project files to their served URLs
            const rel = path.relative(this.projectRoot, resolvedPath).replace(/\\/g, '/');
            rewrittenSpecifier = `/${rel}${isCss ? '?import' : ''}`;
          }
        } catch (err) {
          console.error(`[Ray Core] Error resolving specifier "${specifier}" in file "${file}":`, err);
        }

        s.overwrite(imp.s, imp.e, rewrittenSpecifier);
      }
    }

    const rewrittenCode = s.toString();

    // 3. Register module and update graph links
    const relativeUrl = '/' + path.relative(this.projectRoot, file).replace(/\\/g, '/');
    const node = this.graph.registerModule(file, file, relativeUrl);
    node.lastTransformTime = Date.now();

    this.updateDependencies(file, depIds);

    let finalCode = rewrittenCode;
    const isProjectFile = !file.includes('node_modules');

    if (isProjectFile) {
      // 1. Inject HotContext at the top of the file
      const hotContextInjected = `
if (!import.meta.hot) {
  import.meta.hot = window.__ray_create_hot_context(import.meta.url);
}
`;

      // 2. Intercept react-dom/client createRoot if imported
      let createRootWrapper = '';
      if (finalCode.includes('/@modules/react-dom/client')) {
        // Replace createRoot import with alias
        finalCode = finalCode.replace(
          /import\s*\{\s*createRoot\s*\}\s*from\s*["']\/@modules\/react-dom\/client["']/g,
          'import { createRoot as _createRoot } from "/@modules/react-dom/client"'
        );
        createRootWrapper = `
const createRoot = (container, options) => {
  const root = _createRoot(container, options);
  window.__ray_active_roots.add(root);
  return {
    render(element) {
      window.__ray_root_components.set(root, element);
      root.render(element);
    },
    unmount() {
      window.__ray_active_roots.delete(root);
      window.__ray_root_components.delete(root);
      root.unmount();
    }
  };
};
`;
      }

      // 3. Detect PascalCase components to wrap in state-preserving proxies
      const componentNames: string[] = [];
      const funcRegex = /function\s+([A-Z][a-zA-Z0-9_]*)\b/g;
      let m;
      while ((m = funcRegex.exec(finalCode)) !== null) {
        componentNames.push(m[1]);
      }
      const constRegex = /const\s+([A-Z][a-zA-Z0-9_]*)\b/g;
      while ((m = constRegex.exec(finalCode)) !== null) {
        componentNames.push(m[1]);
      }

      const uniqueNames = Array.from(new Set(componentNames));
      node.isSelfAccepting = uniqueNames.length > 0 || code.includes('import.meta.hot.accept');

      // Rewrite const Component to let Component so we can re-assign them to proxies
      for (const name of uniqueNames) {
        const constPattern = new RegExp(`\\bconst\\s+(${name})\\b`, 'g');
        finalCode = finalCode.replace(constPattern, 'let $1');
      }

      // Construct proxy registrations
      let proxyInjections = '';
      if (uniqueNames.length > 0) {
        proxyInjections = `\n/* Ray React HMR Component Proxies */\n`;
        for (const name of uniqueNames) {
          proxyInjections += `if (typeof ${name} !== 'undefined') {\n  ${name} = window.__ray_register_component(new URL(import.meta.url).pathname, '${name}', ${name});\n}\n`;
        }
      }

      // 4. If it contains components, make it a self-accepting HMR module
      let hmrAcceptance = '';
      if (uniqueNames.length > 0) {
        hmrAcceptance = `
if (import.meta.hot) {
  import.meta.hot.accept();
}
`;
      }

      finalCode = hotContextInjected + '\n' + createRootWrapper + '\n' + finalCode + '\n' + proxyInjections + '\n' + hmrAcceptance;
    }

    return finalCode;
  }

  /**
   * Dynamically compiles a bare npm package entry point to ESM format on the fly.
   * Extracts external dependencies from package.json and marks them as external in esbuild.
   * Rewrites external imports inside the compiled bundle to point to virtual /@modules/.
   */
  async bundleBarePackage(specifier: string, importerDir: string): Promise<string> {
    const resolvedPath = this.resolver.resolveBarePackage(specifier, importerDir);
    const { packageName } = parseSpecifier(specifier);

    // Resolve node_modules/<package> directory path
    let packageDir = resolvedPath;
    while (packageDir && path.basename(packageDir) !== packageName) {
      const parent = path.dirname(packageDir);
      if (parent === packageDir) {
        break;
      }
      packageDir = parent;
    }

    const pkgJsonPath = path.join(packageDir, 'package.json');
    let externals: string[] = [];

    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        externals = [
          ...Object.keys(pkgJson.dependencies || {}),
          ...Object.keys(pkgJson.peerDependencies || {}),
        ];
      } catch (err) {
        console.warn(`[Ray Core] Failed to parse package.json for package: ${packageName}`);
      }
    }

    // Run a single module bundler on-the-fly to output ES module code
    const result = await build({
      entryPoints: [resolvedPath],
      bundle: true,
      format: 'esm',
      target: 'esnext',
      write: false,
      external: externals,
      define: {
        'process.env.NODE_ENV': '"development"',
      },
    });

    const rawCode = result.outputFiles[0].text;

    // Rewrite external package import statements inside the bundled code
    await init;
    const [imports] = parse(rawCode);
    const s = new MagicString(rawCode);

    for (const imp of imports) {
      if (imp.n) {
        const spec = imp.n;
        // If it's a bare import, rewrite it to virtual modules path
        if (!spec.startsWith('.') && !spec.startsWith('/') && !/^(https?|data|blob):/.test(spec)) {
          s.overwrite(imp.s, imp.e, `/@modules/${spec}`);
        }
      }
    }

    return s.toString();
  }
}
