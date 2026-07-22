/**
 * RayBundler
 *
 * Native Ray module bundler replacing esbuild for library and production builds.
 *
 * Pipeline:
 *   Entry → resolve imports recursively → compile each module → inline → emit
 *
 * Features:
 *   - ESM / CJS / UMD / IIFE output formats
 *   - External package exclusion
 *   - define() constant replacement
 *   - Source map passthrough
 *   - CSS and asset file side-channel output
 *   - Deterministic output order (topological)
 *   - Zero Global State
 */
export interface RayBundlerOptions {
    entryPoint: string;
    outFile: string;
    format: 'esm' | 'cjs' | 'iife' | 'umd';
    /** Module/package names that should NOT be inlined */
    external?: string[];
    globalName?: string;
    minify?: boolean;
    sourcemap?: boolean;
    define?: Record<string, string>;
    outDir?: string;
    banner?: string;
    footer?: string;
}
export interface BundleOutput {
    code: string;
    map?: string;
    sizeBytes: number;
    /** Extracted CSS content, if any was encountered */
    css?: string;
}
export declare class RayBundler {
    private compiler;
    private resolver;
    private visitedModules;
    private moduleOrder;
    /** define() map made available to traverse() for pre-compile substitution */
    private defineMap;
    constructor(projectRoot: string, define?: Record<string, string>);
    private resolveFile;
    private extractImports;
    private traverse;
    private wrapModule;
    private applyDefine;
    bundle(options: RayBundlerOptions): Promise<BundleOutput>;
    /**
     * Convenience: bundle into multiple output formats at once.
     */
    bundleFormats(entryPoint: string, outDir: string, formats: Array<'esm' | 'cjs' | 'umd'>, baseOptions: Omit<RayBundlerOptions, 'entryPoint' | 'outFile' | 'format'>): Promise<Record<string, BundleOutput>>;
}
//# sourceMappingURL=rayBundler.d.ts.map