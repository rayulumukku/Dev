import fs from 'fs';
import path from 'path';
import { Resolver, parseSpecifier } from './resolver/index.js';
import { DependencyGraph } from './graph/index.js';
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
import { vuePlugin } from './plugin/official/vue.js';
import { solidPlugin } from './plugin/official/solid.js';
import { sveltePlugin } from './plugin/official/svelte.js';
import { tailwindPlugin } from './plugin/official/tailwind.js';
import { eslintPlugin } from './plugin/official/eslint.js';
import { pwaPlugin } from './plugin/official/pwa.js';
import { imagePlugin } from './plugin/official/image.js';
export const react = reactPlugin;
export const svg = svgPlugin;
export const mdx = mdxPlugin;
export const wasm = wasmPlugin;
export const json = jsonPlugin;
export const copy = copyPlugin;
export const vue = vuePlugin;
export const solid = solidPlugin;
export const svelte = sveltePlugin;
export const tailwind = tailwindPlugin;
export const eslint = eslintPlugin;
export const pwa = pwaPlugin;
export const image = imagePlugin;
export * from './plugin/index.js';
import { CompilerCacheStore } from './diagnostics/cacheStore.js';
import { RayCompiler } from './compiler/index.js';
import { RayCloudClient } from './diagnostics/cloudClient.js';
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
export { transformCjsToEsm } from './compiler/index.js';
// ─── Parallel Scheduler & Bundler ───────────────────────────────────────────
export { ChunkMerger } from './build/chunkMerger.js';
export { RayBundler } from './build/rayBundler.js';
// ─── Application Platform — Runtime ─────────────────────────────────────────
export { RuntimeAdapter } from './runtime/index.js';
// ─── Application Platform — Live Tooling ────────────────────────────────────
export { LiveASTViewer, liveASTViewer } from './live/astViewer.js';
export { VisualPluginDebugger, pluginDebugger } from './live/pluginDebugger.js';
// ─── Application Platform — Auto Optimisations ───────────────────────────────
export { AutoBundleSplitter } from './platform/bundleSplitter.js';
export { AutoLazyLoader } from './platform/lazyLoader.js';
// ─── Application Platform — AI Features ─────────────────────────────────────
export { CompilerSuggestions } from './ai/compilerSuggestions.js';
export { StaticPerformanceAnalyzer } from './ai/staticPerformanceAnalyzer.js';
export class RayCore {
    resolver;
    graph;
    projectRoot;
    container;
    config = { plugins: [] };
    mode;
    env = {};
    optimizerResult = null;
    cacheStore;
    compilerEngine;
    cloudClient;
    constructor(projectRoot, mode = 'development') {
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
        globalThis.__ray_config_compiler = this.config.compiler || 'auto';
        const globalHash = this.cacheStore.computeGlobalHash(this.mode, this.config);
        this.cacheStore.load(globalHash);
        // Rebuild graph nodes from cache entries
        const cachedFiles = this.cacheStore.cacheData.files || {};
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
            const depsSet = new Set(entry.deps);
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
        globalThis.__ray_cache_store = this.cacheStore;
        const context = {
            projectRoot: this.projectRoot,
            resolver: this.resolver,
            graph: this.graph,
            logger: console,
            buildMode: 'development',
            cacheStore: this.cacheStore,
            emitFile: (name, content) => {
                // Stub for dynamic asset output
            },
            addWatchFile: (file) => {
                // Stub for custom watch additions
            },
            resolveId: async (id, importer) => {
                return this.container.resolveId(id, importer);
            }
        };
        this.container = new PluginContainer([...builtinPlugins, ...userPlugins], context);
    }
    /**
     * Triggers the dependency pre-bundling optimizer.
     */
    async optimize(options = {}) {
        this.optimizerResult = await runOptimizer(this.projectRoot, this.config, this.resolver, options);
        return this.optimizerResult;
    }
    /**
     * Resolves an import specifier.
     */
    resolve(specifier, importer) {
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
    async transform(code, file) {
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
            let finalCode = cached.code;
            if (cached.map && !finalCode.includes('sourceMappingURL=')) {
                const mapBase64 = Buffer.from(typeof cached.map === 'string' ? cached.map : JSON.stringify(cached.map)).toString('base64');
                finalCode += `\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
            }
            return finalCode;
        }
        // Cache miss: compile module
        node.status = 'rebuilding';
        const startTransform = performance.now();
        const result = await this.container.transform(code, file);
        const transformDuration = performance.now() - startTransform;
        let finalCode = result.code;
        if (result.map) {
            const mapBase64 = Buffer.from(JSON.stringify(result.map)).toString('base64');
            finalCode += `\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
        }
        node.status = 'clean';
        node.hash = contentHash;
        node.cachedOutput = { code: finalCode, map: result.map };
        if (!node.ast) {
            node.ast = { type: 'Program', body: [] };
        }
        const deps = Array.from(this.graph.getDependencies(cleanPath));
        const importers = Array.from(this.graph.getImporters(cleanPath));
        this.cacheStore.set(cleanPath, contentHash, {
            code: finalCode,
            map: result.map,
            ast: node.ast,
            deps,
            importers,
            isSelfAccepting: node.isSelfAccepting
        });
        this.cacheStore.save();
        return finalCode;
    }
    invalidate(id) {
        const cleanPath = id.split('?')[0];
        const node = this.graph.getModule(cleanPath);
        if (node) {
            node.status = 'dirty';
            node.lastTransformTime = 0;
            const visited = new Set();
            const propagate = (n) => {
                if (visited.has(n.id))
                    return;
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
    getImporters(id) {
        return this.graph.getImporters(id);
    }
    getDependencies(id) {
        return this.graph.getDependencies(id);
    }
    /**
     * Compiles bare NPM modules into standalone browser-compatible ES Modules.
     */
    async bundleBarePackage(specifier, importerDir) {
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
        let externals = [];
        if (fs.existsSync(pkgJsonPath)) {
            try {
                const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
                externals = [
                    ...Object.keys(pkgJson.dependencies || {}),
                    ...Object.keys(pkgJson.peerDependencies || {})
                ];
            }
            catch (err) {
                // Ignore
            }
        }
        // Bundle via RayBundler (no esbuild)
        const { RayBundler } = await import('./build/rayBundler.js');
        const bundler = new RayBundler(this.projectRoot);
        const tmpOut = path.join(this.projectRoot, '.ray', `pkg.${Date.now()}.js`);
        fs.mkdirSync(path.dirname(tmpOut), { recursive: true });
        const output = await bundler.bundle({
            entryPoint: resolvedPath,
            outFile: tmpOut,
            format: 'esm',
            external: externals,
            define: {
                'process.env.NODE_ENV': JSON.stringify(this.mode || 'development'),
            },
        });
        try {
            fs.unlinkSync(tmpOut);
        }
        catch { }
        let rewrittenCode = output.code.replace(/(\b(?:import|export)\s+[\w\s*{},\$]+from\s+['"])([^'"./][^'"]*)(['"])/g, '$1/@modules/$2$3');
        rewrittenCode = rewrittenCode.replace(/(\bimport\s+['"])([^'"./][^'"]*)(['"])/g, '$1/@modules/$2$3');
        return rewrittenCode;
    }
    /**
     * Dynamically compiles and loads a target module inside the server Node environment.
     */
    async ssrLoadModule(filePath) {
        const tempOut = path.join(this.projectRoot, '.ray', `ssr.${Date.now()}.mjs`);
        fs.mkdirSync(path.dirname(tempOut), { recursive: true });
        // Read and process the source for Node.js compatibility:
        //  1. Rewrite relative imports to absolute file:// URLs (Node won't resolve
        //     bare .jsx/.ts extensions from temp directories)
        //  2. Rewrite bare package imports to node_modules paths
        //  3. Keep the source otherwise intact — avoids the async-function codegen
        //     bug in the current Ray Compiler pipeline
        let src = fs.readFileSync(filePath, 'utf-8');
        const fileDir = path.dirname(filePath);
        // Rewrite relative imports to absolute paths
        src = src.replace(/from\s+['"](\.[^'"]+)['"]/g, (_match, spec) => {
            const resolved = this.resolveImportPath(spec, fileDir);
            return `from ${JSON.stringify(resolved)}`;
        });
        // Rewrite bare package imports (e.g. 'react') to node_modules absolute paths as file:// URLs
        src = src.replace(/from\s+['"]([^'"./][^'"]*)['"]/g, (_match, spec) => {
            try {
                const resolved = this.resolver.resolveBarePackage(spec, fileDir);
                return `from ${JSON.stringify(pathToFileURL(resolved).toString())}`;
            }
            catch {
                return _match; // leave as-is if cannot resolve
            }
        });
        fs.writeFileSync(tempOut, src, 'utf-8');
        try {
            const fileUrl = pathToFileURL(tempOut).toString() + `?t=${Date.now()}`;
            const mod = await import(/* @vite-ignore */ fileUrl);
            return mod;
        }
        finally {
            try {
                if (fs.existsSync(tempOut))
                    fs.unlinkSync(tempOut);
            }
            catch {
                // Ignore cleanup errors
            }
        }
    }
    resolveImportPath(spec, fromDir) {
        const candidates = [
            path.resolve(fromDir, spec),
            path.resolve(fromDir, spec + '.js'),
            path.resolve(fromDir, spec + '.jsx'),
            path.resolve(fromDir, spec + '.ts'),
            path.resolve(fromDir, spec + '.tsx'),
            path.resolve(fromDir, spec, 'index.js'),
            path.resolve(fromDir, spec, 'index.jsx'),
        ];
        for (const c of candidates) {
            if (fs.existsSync(c))
                return pathToFileURL(c).toString();
        }
        return pathToFileURL(path.resolve(fromDir, spec)).toString();
    }
}
//# sourceMappingURL=index.js.map