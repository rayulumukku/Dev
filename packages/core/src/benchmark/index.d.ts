interface BenchmarkOptions {
    runs?: number;
    compare?: string;
    project?: string;
}
/**
 * Runs a deterministic benchmarking cycle measuring compilation times, cold/warm runs,
 * and generating comparative graphs.
 */
export declare function runBenchmark(projectRoot: string, options: BenchmarkOptions): Promise<void>;
export interface PerformanceMetrics {
    coldStart: number;
    warmStart: number;
    hmrLatency: number;
    buildSpeed: number;
    memory: number;
    cpu: number;
    pluginExecution: number;
    cacheHitRatio: number;
    bundleSize: number;
    dependencyOptimizationTime: number;
}
/**
 * Dynamically measures the 8 performance metrics of the compiler in the target project.
 */
export declare function measurePerformance(projectRoot: string): Promise<PerformanceMetrics>;
/**
 * Compares current performance metrics against baseline, enforcing at least one
 * improvement and no regressions.
 */
export declare function comparePerformance(baseline: PerformanceMetrics, current: PerformanceMetrics): {
    passed: boolean;
    improved: boolean;
    regressed: boolean;
    report: string;
    improvedMetrics: string[];
    regressedMetrics: string[];
};
export {};
//# sourceMappingURL=index.d.ts.map