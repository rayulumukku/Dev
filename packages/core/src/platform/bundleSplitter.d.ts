/**
 * AutoBundleSplitter
 *
 * Analyses the DependencyGraph to identify automatic code split points:
 * large shared modules imported by ≥ 2 independent entry points should be
 * extracted into a separate async chunk.
 *
 * Satisfies: Incremental · Cacheable · Deterministic · Observable · Zero Global State
 */
export interface SplitPoint {
    /** The shared module file path */
    file: string;
    /** Number of different entry points that import this file (directly or transitively) */
    sharedByCount: number;
    /** Estimated byte size of the module (from source length) */
    estimatedBytes: number;
    /** Recommended action */
    recommendation: 'split' | 'keep';
}
export interface SplitAnalysis {
    splitPoints: SplitPoint[];
    totalModules: number;
    recommendedSplitCount: number;
    estimatedSavingsBytes: number;
}
export declare class AutoBundleSplitter {
    /**
     * Minimum number of bytes a module must exceed to be considered for splitting.
     */
    private sizeThresholdBytes;
    /**
     * Minimum number of independent importers required to qualify as a split point.
     */
    private importerThreshold;
    constructor(options?: {
        sizeThresholdBytes?: number;
        importerThreshold?: number;
    });
    /**
     * Analyse the dependency graph and return split point recommendations.
     *
     * @param graph - The Ray DependencyGraph instance
     * @param entryFiles - The known entry-point file paths
     */
    analyze(graph: any, entryFiles: string[]): SplitAnalysis;
    private traverse;
    private estimateSize;
    /**
     * HTTP handler for /__ray/platform/split
     */
    httpHandler(graph: any, entryFiles: string[]): (req: any, res: any) => void;
}
export default AutoBundleSplitter;
//# sourceMappingURL=bundleSplitter.d.ts.map