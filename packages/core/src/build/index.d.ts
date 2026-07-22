interface BuildOptions {
    outDir: string;
    minify: boolean;
    sourcemap: string | boolean;
    watch: boolean;
    analyze: boolean;
    ssr?: boolean;
    ssg?: boolean;
    lib?: boolean;
    entry?: string;
    name?: string;
    formats?: string;
    external?: string;
    dts?: boolean;
    mode?: string;
    remote?: boolean;
}
/**
 * Executes a production-optimized build of the Ray project.
 * Supports splitting into client browser builds, target Node.js server bundles,
 * SSG static HTML page compilation, and reusable Library Mode bundling.
 */
export declare function buildProject(options: BuildOptions): Promise<import("./remoteExecutor.js").RemoteBuildSummary | undefined>;
export {};
//# sourceMappingURL=index.d.ts.map