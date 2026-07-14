import { RayPlugin, PluginContext } from '../index.js';
import { transformJsx } from '@ray/transform';
import { init, parse } from 'es-module-lexer';
import MagicString from 'magic-string';
import path from 'path';

function resolve(specifier: string, importer: string, resolver: any, projectRoot: string): string {
  if (specifier.startsWith('.') || specifier.startsWith('..')) {
    return path.resolve(path.dirname(importer), specifier);
  }
  if (specifier.startsWith('/')) {
    if (specifier.startsWith('/@modules/')) {
      const bareSpec = specifier.slice('/@modules/'.length);
      return resolver.resolveBarePackage(bareSpec, projectRoot);
    }
    return path.join(projectRoot, specifier.slice(1));
  }
  return resolver.resolveBarePackage(specifier, path.dirname(importer));
}

/**
 * Builtin plugin for compiling JSX/TSX/TS files, rewriting import/export specifiers,
 * and wrapping components in HMR proxies.
 */
export function jsxPlugin(): RayPlugin {
  return {
    name: 'ray:jsx',

    async transform(this: PluginContext, code, id) {
      const ext = path.extname(id);
      const isJsxOrTs = ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
      if (!isJsxOrTs) return null;

      await init;

      // 1. Compile JSX/TS
      let jsCode = code;
      const isTransformable = ['.jsx', '.tsx', '.ts'].includes(ext);
      if (isTransformable) {
        jsCode = await transformJsx(code, id);
      }

      // 2. Parse and rewrite imports/exports
      const [imports] = parse(jsCode);
      const s = new MagicString(jsCode);
      const depIds = new Set<string>();

      for (const imp of imports) {
        const specifier = imp.n;
        if (specifier) {
          let rewrittenSpecifier = specifier;
          try {
            // First check if any plugin resolveId hook resolves the specifier (e.g., virtual modules)
            const pluginResolved = await this.resolveId(specifier, id);
            let resolvedPath = '';

            if (pluginResolved !== null) {
              resolvedPath = pluginResolved;
            } else {
              resolvedPath = resolve(specifier, id, this.resolver, this.projectRoot);
            }

            depIds.add(resolvedPath);

            if (resolvedPath.startsWith('\0virtual:')) {
              // Rewrite virtual modules to virtual namespaces served by dev-server
              const virtName = resolvedPath.slice('\0virtual:'.length);
              rewrittenSpecifier = `/@virtual/${virtName}?import`;
            } else if (resolvedPath.includes('node_modules')) {
              const idx = resolvedPath.indexOf('node_modules');
              const rel = resolvedPath.slice(idx + 'node_modules/'.length).replace(/\\/g, '/');
              rewrittenSpecifier = `/@modules/${rel}`;
            } else {
              const rel = path.relative(this.projectRoot, resolvedPath).replace(/\\/g, '/');
              rewrittenSpecifier = '/' + rel;
              const isCss = path.extname(resolvedPath) === '.css';
              const isAsset = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.otf'].includes(path.extname(resolvedPath).toLowerCase());
              if (isCss || isAsset) {
                rewrittenSpecifier += '?import';
              }
            }
          } catch (err: any) {
            this.logger.error(`[Ray JSX Plugin] Resolving error for "${specifier}" in "${id}": ${err.message}`);
          }

          s.overwrite(imp.s, imp.e, rewrittenSpecifier);
        }
      }

      const rewrittenCode = s.toString();

      // 3. Register module and update graph links
      const relativeUrl = '/' + path.relative(this.projectRoot, id).replace(/\\/g, '/');
      const node = this.graph.registerModule(id, id, relativeUrl);
      node.lastTransformTime = Date.now();

      // Helper to update dependencies inside context
      this.graph.updateDependencies(id, depIds, (depId: string) => {
        let depUrl = '';
        if (depId.includes('\0virtual:')) {
          const virtName = depId.slice('\0virtual:'.length);
          depUrl = `/@virtual/${virtName}?import`;
        } else if (depId.includes('node_modules')) {
          const idx = depId.indexOf('node_modules');
          const rel = depId.slice(idx + 'node_modules/'.length).replace(/\\/g, '/');
          depUrl = `/@modules/${rel}`;
        } else {
          depUrl = '/' + path.relative(this.projectRoot, depId).replace(/\\/g, '/');
        }
        return { file: depId, url: depUrl };
      });

      let finalCode = rewrittenCode;
      const isProjectFile = !id.includes('node_modules') && !id.includes('\0virtual:');

      if (isProjectFile) {
        // Intercept react-dom/client createRoot
        let createRootWrapper = '';
        if (finalCode.includes('/@modules/react-dom/client')) {
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

        // Detect PascalCase components
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

        for (const name of uniqueNames) {
          const constPattern = new RegExp(`\\bconst\\s+(${name})\\b`, 'g');
          finalCode = finalCode.replace(constPattern, 'let $1');
        }

        let proxyInjections = '';
        if (uniqueNames.length > 0) {
          proxyInjections = `\n/* Ray React HMR Component Proxies */\n`;
          for (const name of uniqueNames) {
            proxyInjections += `if (typeof ${name} !== 'undefined') {\n  ${name} = window.__ray_register_component(new URL(import.meta.url).pathname, '${name}', ${name});\n}\n`;
          }
        }

        let hmrAcceptance = '';
        if (uniqueNames.length > 0) {
          hmrAcceptance = `
if (import.meta.hot) {
  import.meta.hot.accept();
}
`;
        }

        finalCode = createRootWrapper + '\n' + finalCode + '\n' + proxyInjections + '\n' + hmrAcceptance;
      }

      return { code: finalCode };
    },
  };
}
