import fs from 'fs';
import path from 'path';
import { Resolver, parseSpecifier } from './resolver/index.js';
import { DependencyGraph } from './graph/index.js';
import { ModuleNode } from './graph/moduleNode.js';
import { build } from 'esbuild';
import { pathToFileURL } from 'url';

import { loadConfig } from './plugin/config.js';
import { PluginContainer } from './plugin/container.js';
import { jsxPlugin } from './plugin/builtins/jsxPlugin.js';
import { cssPlugin } from './plugin/builtins/cssPlugin.js';
import { htmlPlugin } from './plugin/builtins/htmlPlugin.js';
import { assetsPlugin } from './plugin/builtins/assetsPlugin.js';
import { hmrPlugin } from './plugin/builtins/hmrPlugin.js';
import { envPlugin } from './plugin/builtins/envPlugin.js';
import { loadEnv } from './plugin/env.js';
import { PluginContext } from './plugin/index.js';
import { runOptimizer } from './optimizer/index.js';

export { Resolver } from './resolver/index.js';
export { DependencyGraph } from './graph/index.js';
export { ModuleNode } from './graph/moduleNode.js';
export { buildProject } from './build/index.js';
export { PluginContainer } from './plugin/container.js';
export { runOptimizer } from './optimizer/index.js';

import { reactPlugin } from './plugin/official/react.js';
import { svgPlugin } from './plugin/official/svg.js';
import { mdxPlugin } from './plugin/official/mdx.js';
import { wasmPlugin } from './plugin/official/wasm.js';
import { jsonPlugin } from './plugin/official/json.js';
import { copyPlugin } from './plugin/official/copy.js';

export const react = reactPlugin;
export const svg = svgPlugin;
export const mdx = mdxPlugin;
export const wasm = wasmPlugin;
export const json = jsonPlugin;
export const copy = copyPlugin;
export * from './plugin/index.js';

import { runDoctor, printDoctorReport } from './diagnostics/doctor.js';
import { displayStats } from './diagnostics/stats.js';
import { runBenchmark } from './benchmark/index.js';
import { runRelease } from './diagnostics/release.js';
import { runVerify, printVerifyReport } from './diagnostics/verify.js';
import { studio } from './diagnostics/studioApi.js';
import { CompilerCacheStore } from './diagnostics/cacheStore.js';
import { BuildScheduler } from './build/buildScheduler.js';
import { RayCompiler } from './compiler/index.js';
import { RayCloudClient } from './diagnostics/cloudClient.js';
import { DistributedBuildExecutor } from './build/remoteExecutor.js';
import { Scope, ScopeAnalyzer } from './compiler/scope.js';
import { ASTVisitor } from './compiler/visitor.js';

export { runDoctor, printDoctorReport } from './diagnostics/doctor.js';
export { displayStats } from './diagnostics/stats.js';
export { runBenchmark } from './benchmark/index.js';
export { runRelease } from './diagnostics/release.js';
export { runVerify, printVerifyReport } from './diagnostics/verify.js';
export { studio } from './diagnostics/studioApi.js';
export { CompilerCacheStore } from './diagnostics/cacheStore.js';
export { BuildScheduler } from './build/buildScheduler.js';
export { RayCompiler } from './compiler/index.js';
export { RayCloudClient } from './diagnostics/cloudClient.js';
export { DistributedBuildExecutor } from './build/remoteExecutor.js';
export { Scope, ScopeAnalyzer } from './compiler/scope.js';
export { ASTVisitor } from './compiler/visitor.js';

export class RayCore {
  resolver: Resolver;
  graph: DependencyGraph;
  projectRoot: string;
  container!: PluginContainer;
  config: any = { plugins: [] };
  mode: string;
  env: Record<string, string> = {};
  optimizerResult: any = null;
  cacheStore: CompilerCacheStore;
  compilerEngine!: RayCompiler;
  cloudClient: RayCloudClient;

  constructor(projectRoot: string, mode = 'development') {
    this.projectRoot = projectRoot;
    this.resolver = new Resolver(projectRoot);
    this.graph = new DependencyGraph();
    this.mode = mode;
    this.cacheStore = new CompilerCacheStore(projectRoot);
    this.cloudClient = new RayCloudClient(projectRoot);
  }

  /**
   * Initializes the plugin platform, parsing configuration, loading environments, and assembling the container.
   */
  async init() {
    this.config = await loadConfig(this.projectRoot);
    const userPlugins = this.config.plugins || [];

    const finalMode = this.mode || this.config.mode || 'development';
    this.mode = finalMode;

    const envPrefix = this.config.envPrefix || 'RAY_';
    this.env = loadEnv(finalMode, this.projectRoot, envPrefix);

    this.compilerEngine = new RayCompiler(this.env);
    (globalThis as any).__ray_config_compiler = this.config.compiler || 'auto';

    const globalHash = this.cacheStore.computeGlobalHash(this.mode, this.config);
    this.cacheStore.load(globalHash);

    // Rebuild graph nodes from cache entries
    const cachedFiles = (this.cacheStore as any).cacheData.files || {};
    for (const file of Object.keys(cachedFiles)) {
      const entry = cachedFiles[file];
      const node = this.graph.registerModule(file, file, '/' + path.relative(this.projectRoot, file).replace(/\\/g, '/'));
      node.hash = entry.hash;
      node.cachedOutput = { code: entry.code, map: entry.map };
      node.ast = entry.ast;
      node.isSelfAccepting = entry.isSelfAccepting;
      node.status = 'clean';
    }

    // Restore graph relationships
    for (const file of Object.keys(cachedFiles)) {
      const entry = cachedFiles[file];
      const depsSet = new Set<string>(entry.deps);
      this.graph.updateDependencies(file, depsSet, (depId) => {
        return {
          file: depId,
          url: '/' + path.relative(this.projectRoot, depId).replace(/\\/g, '/'),
        };
      });
    }

    const builtinPlugins = [
      envPlugin(this.env, finalMode, envPrefix, this.config.define || {}),
      hmrPlugin(),
      jsxPlugin(),
      cssPlugin(),
      htmlPlugin(),
      assetsPlugin()
    ];

    (globalThis as any).__ray_cache_store = this.cacheStore;

    const context: PluginContext = {
      projectRoot: this.projectRoot,
      resolver: this.resolver,
      graph: this.graph,
      logger: console,
      buildMode: 'development',
      cacheStore: this.cacheStore as any,
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
   * Triggers the dependency pre-bundling optimizer.
   */
  async optimize(options: { force?: boolean; clear?: boolean } = {}) {
    this.optimizerResult = await runOptimizer(this.projectRoot, this.config, this.resolver, options);
    return this.optimizerResult;
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
      if (specifier.startsWith('/@ray/deps/')) {
        const fileName = path.basename(specifier);
        return path.join(this.projectRoot, '.ray/cache', fileName);
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

    const startLookup = performance.now();
    const cleanPath = file.split('?')[0];
    const contentHash = this.cacheStore.computeHash(code);

    // Attempt cache hit
    const cached = this.cacheStore.get(cleanPath, contentHash);
    const lookupDuration = performance.now() - startLookup;

    const node = this.graph.registerModule(cleanPath, cleanPath, '/' + path.relative(this.projectRoot, cleanPath).replace(/\\/g, '/'));

    if (cached !== null) {
      node.status = 'clean';
      node.hash = contentHash;
      node.cachedOutput = { code: cached.code, map: cached.map };
      node.ast = cached.ast;
      node.isSelfAccepting = cached.isSelfAccepting;

      const depsSet = new Set(cached.deps);
      this.graph.updateDependencies(cleanPath, depsSet, (depId) => {
        return {
          file: depId,
          url: '/' + path.relative(this.projectRoot, depId).replace(/\\/g, '/'),
        };
      });

      return cached.code;
    }

    // Cache miss: compile module
    node.status = 'rebuilding';
    const startTransform = performance.now();
    const result = await this.container.transform(code, file);
    const transformDuration = performance.now() - startTransform;

    node.status = 'clean';
    node.hash = contentHash;
    node.cachedOutput = { code: result.code, map: result.map };
    if (!node.ast) {
      node.ast = { type: 'Program', body: [] };
    }

    const deps = Array.from(this.graph.getDependencies(cleanPath));
    const importers = Array.from(this.graph.getImporters(cleanPath));

    this.cacheStore.set(cleanPath, contentHash, {
      code: result.code,
      map: result.map,
      ast: node.ast,
      deps,
      importers,
      isSelfAccepting: node.isSelfAccepting
    });
    this.cacheStore.save();

    return result.code;
  }

  invalidate(id: string): void {
    const cleanPath = id.split('?')[0];
    const node = this.graph.getModule(cleanPath);
    if (node) {
      node.status = 'dirty';
      node.lastTransformTime = 0;

      const visited = new Set<string>();
      const propagate = (n: any) => {
        if (visited.has(n.id)) return;
        visited.add(n.id);
        for (const imp of n.importers) {
          imp.status = 'dirty';
          propagate(imp);
        }
      };
      propagate(node);
    }
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

  /**
   * Dynamically compiles and loads a target module inside the server Node environment.
   */
  async ssrLoadModule(filePath: string): Promise<any> {
    const tempOut = path.join(this.projectRoot, '.ray', `ssr.${Date.now()}.js`);
    fs.mkdirSync(path.dirname(tempOut), { recursive: true });

    const ssrVirtualPlugin = {
      name: 'ssr-virtual-modules',
      setup(build: any) {
        build.onResolve({ filter: /^virtual:/ }, (args: any) => ({
          path: args.path,
          namespace: 'virtual',
        }));
        build.onLoad({ filter: /.*/, namespace: 'virtual' }, (args: any) => {
          if (args.path === 'virtual:foo') {
            return {
              contents: 'export const message = "Hello from Virtual Module foo!";',
              loader: 'js',
            };
          }
          return null;
        });
      }
    };

    await build({
      entryPoints: [filePath],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: tempOut,
      write: true,
      plugins: [ssrVirtualPlugin],
      external: [
        'react',
        'react-dom',
        'react-dom/server',
        'react-router-dom',
        'react-router-dom/server',
        'react-router'
      ],
    });

    try {
      const fileUrl = pathToFileURL(tempOut).toString() + `?t=${Date.now()}`;
      const mod = await import(fileUrl);
      return mod;
    } finally {
      try {
        if (fs.existsSync(tempOut)) {
          fs.unlinkSync(tempOut);
        }
      } catch {
        // Ignore
      }
    }
  }
}
