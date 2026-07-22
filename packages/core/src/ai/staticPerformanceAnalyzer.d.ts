/**
 * StaticPerformanceAnalyzer
 *
 * Whole-graph static analysis that computes:
 *  - Bundle size estimate per module
 *  - Heavy synchronous require() shims
 *  - Import depth (distance from entry point)
 *  - Top-N hottest re-render candidates from component tree structure
 *
 * Satisfies: Incremental · Deterministic · Observable · Zero Global State
 */
export interface ModulePerformanceReport {
    file: string;
    estimatedBytes: number;
    /** Number of modules that import this module (fan-in) */
    importerCount: number;
    /** Number of modules this module imports (fan-out) */
    dependencyCount: number;
    /** Maximum depth from any entry point */
    maxDepth: number;
    /** Whether a synchronous require() shim was detected */
    hasSyncRequire: boolean;
    /** Whether this looks like a React component (PascalCase export + JSX) */
    isComponent: boolean;
    /** Heuristic re-render risk (0-100) */
    rerenderRisk: number;
}
export interface PerformanceAnalysis {
    modules: ModulePerformanceReport[];
    totalEstimatedBytes: number;
    heaviestModules: ModulePerformanceReport[];
    hotComponents: ModulePerformanceReport[];
    syncRequireModules: ModulePerformanceReport[];
}
export declare class StaticPerformanceAnalyzer {
    private topN;
    constructor(options?: {
        topN?: number;
    });
    /**
     * Analyse the full dependency graph and produce a performance report.
     *
     * @param graph - The Ray DependencyGraph instance
     * @param entryFiles - Known entry-point file paths
     */
    analyze(graph: any, entryFiles: string[]): PerformanceAnalysis;
    private bfsDepth;
    /**
     * HTTP handler for /__ray/perf endpoint
     */
    httpHandler(graph: any, entryFiles: string[]): (req: any, res: any) => void;
}
export default StaticPerformanceAnalyzer;
//# sourceMappingURL=staticPerformanceAnalyzer.d.ts.map