import fs from 'fs';
import path from 'path';
import { Resolver, parseSpecifier } from './resolver/index.js';
import { DependencyGraph } from './graph/index.js';
import { ModuleNode } from './graph/moduleNode.js';
import { build } from 'esbuild';

import { loadConfig } from './plugin/config.js';
import { PluginContainer } from './plugin/container.js';
import { jsxPlugin } from './plugin/builtins/jsxPlugin.js';
import { cssPlugin } from './plugin/builtins/cssPlugin.js';
import { htmlPlugin } from './plugin/builtins/htmlPlugin.js';
import { assetsPlugin } from './plugin/builtins/assetsPlugin.js';
import { hmrPlugin } from './plugin/builtins/hmrPlugin.js';
import { PluginContext } from './plugin/index.js';

export { Resolver } from './resolver/index.js';
export { DependencyGraph } from './graph/index.js';
export { ModuleNode } from './graph/moduleNode.js';
export { buildProject } from './build/index.js';
export { PluginContainer } from './plugin/container.js';
export * from './plugin/index.js';

export class RayCore {
  resolver: Resolver;
  graph: DependencyGraph;
  projectRoot: string;
  container!: PluginContainer;
  config: any = { plugins: [] };

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.resolver = new Resolver(projectRoot);
    this.graph = new DependencyGraph();
  }

  /**
   * Initializes the plugin platform, parsing configuration, and assembling the plugin container.
   */
  async init() {
    this.config = await loadConfig(this.projectRoot);
    const userPlugins = this.config.plugins || [];

    const builtinPlugins = [
      hmrPlugin(),
      jsxPlugin(),
      cssPlugin(),
      htmlPlugin(),
      assetsPlugin()
    ];

    const context: PluginContext = {
      projectRoot: this.projectRoot,
      resolver: this.resolver,
      graph: this.graph,
      logger: console,
      buildMode: 'development',
      emitFile: (name: string, content: string | Buffer) => {
        // Stub for dynamic asset output
      },
      addWatchFile: (file: string) => {
        // Stub for custom watch additions
      },
      resolveId: async (id: string, importer?: string) => {
        return this.container.resolveId(id, importer);
      }
    };

    this.container = new PluginContainer([...builtinPlugins, ...userPlugins], context);
  }

  /**
   * Resolves an import specifier.
   */
  resolve(specifier: string, importer: string): string {
    if (specifier.startsWith('.') || specifier.startsWith('..')) {
      return path.resolve(path.dirname(importer), specifier);
    }
    if (specifier.startsWith('/')) {
      if (specifier.startsWith('/@modules/')) {
        const bareSpec = specifier.slice('/@modules/'.length);
        return this.resolver.resolveBarePackage(bareSpec, this.projectRoot);
      }
      return path.join(this.projectRoot, specifier.slice(1));
    }
    return this.resolver.resolveBarePackage(specifier, path.dirname(importer));
  }

  /**
   * Transforms source code by delegating it to the plugin container pipeline.
   */
  async transform(code: string, file: string): Promise<string> {
    if (!this.container) {
      await this.init();
    }
    const result = await this.container.transform(code, file);
    return result.code;
  }

  invalidate(id: string): void {
    this.graph.invalidate(id);
  }

  getImporters(id: string): Set<string> {
    return this.graph.getImporters(id);
  }

  getDependencies(id: string): Set<string> {
    return this.graph.getDependencies(id);
  }

  /**
   * Compiles bare NPM modules into standalone browser-compatible ES Modules.
   */
  async bundleBarePackage(specifier: string, importerDir: string): Promise<string> {
    const resolvedPath = this.resolver.resolveBarePackage(specifier, importerDir);
    const { packageName } = parseSpecifier(specifier);

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
          ...Object.keys(pkgJson.peerDependencies || {})
        ];
      } catch (err) {
        // Ignore
      }
    }

    const result = await build({
      entryPoints: [resolvedPath],
      bundle: true,
      format: 'esm',
      external: externals,
      write: false
    });

    if (!result.outputFiles || result.outputFiles.length === 0) {
      throw new Error(`Bundling failed for bare package: ${specifier}`);
    }

    return result.outputFiles[0].text;
  }
}
