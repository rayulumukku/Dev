import { Resolver } from './resolver/index.js';
import { DependencyGraph } from './graph/index.js';
import { PluginContainer } from './plugin/container.js';
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
export declare const react: typeof reactPlugin;
export declare const svg: typeof svgPlugin;
export declare const mdx: typeof mdxPlugin;
export declare const wasm: typeof wasmPlugin;
export declare const json: typeof jsonPlugin;
export declare const copy: typeof copyPlugin;
export declare const vue: typeof vuePlugin;
export declare const solid: typeof solidPlugin;
export declare const svelte: typeof sveltePlugin;
export declare const tailwind: typeof tailwindPlugin;
export declare const eslint: typeof eslintPlugin;
export declare const pwa: typeof pwaPlugin;
export declare const image: typeof imagePlugin;
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
export { ChunkMerger } from './build/chunkMerger.js';
export { RayBundler } from './build/rayBundler.js';
export { RuntimeAdapter } from './runtime/index.js';
export { LiveASTViewer, liveASTViewer } from './live/astViewer.js';
export { VisualPluginDebugger, pluginDebugger } from './live/pluginDebugger.js';
export { AutoBundleSplitter } from './platform/bundleSplitter.js';
export { AutoLazyLoader } from './platform/lazyLoader.js';
export { CompilerSuggestions } from './ai/compilerSuggestions.js';
export { StaticPerformanceAnalyzer } from './ai/staticPerformanceAnalyzer.js';
export declare class RayCore {
    resolver: Resolver;
    graph: DependencyGraph;
    projectRoot: string;
    container: PluginContainer;
    config: any;
    mode: string;
    env: Record<string, string>;
    optimizerResult: any;
    cacheStore: CompilerCacheStore;
    compilerEngine: RayCompiler;
    cloudClient: RayCloudClient;
    constructor(projectRoot: string, mode?: string);
    /**
     * Initializes the plugin platform, parsing configuration, loading environments, and assembling the container.
     */
    init(): Promise<void>;
    /**
     * Triggers the dependency pre-bundling optimizer.
     */
    optimize(options?: {
        force?: boolean;
        clear?: boolean;
    }): Promise<any>;
    /**
     * Resolves an import specifier.
     */
    resolve(specifier: string, importer: string): string;
    /**
     * Transforms source code by delegating it to the plugin container pipeline.
     */
    transform(code: string, file: string): Promise<string>;
    invalidate(id: string): void;
    getImporters(id: string): Set<string>;
    getDependencies(id: string): Set<string>;
    /**
     * Compiles bare NPM modules into standalone browser-compatible ES Modules.
     */
    bundleBarePackage(specifier: string, importerDir: string): Promise<string>;
    /**
     * Dynamically compiles and loads a target module inside the server Node environment.
     */
    ssrLoadModule(filePath: string): Promise<any>;
    private resolveImportPath;
}
//# sourceMappingURL=index.d.ts.map