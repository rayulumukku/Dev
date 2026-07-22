import { RayCore } from '../index.js';
export interface BatchBuildResult {
    durationMs: number;
    compiledCount: number;
    /** Merged bundle when mergeOutput=true */
    bundle?: {
        code: string;
        map: string;
    };
    /** Per-file results */
    results: Record<string, {
        code: string;
        map?: string;
    }>;
}
/**
 * BuildScheduler
 *
 * Orchestrates parallel module compilation using:
 *  1. Kahn's topological sort on the DependencyGraph to identify fully
 *     independent module groups (levels).
 *  2. Worker-pool dispatch: each level's modules are compiled simultaneously
 *     across worker threads.
 *  3. ChunkMerger: deterministic merge of parallel results into a single bundle.
 *
 * Satisfies: Parallel · Incremental · Deterministic · Observable · Cacheable
 */
export declare class BuildScheduler {
    private ray;
    private workerCount;
    private workerPath;
    constructor(ray: RayCore, workerCount?: number);
    /**
     * Returns an ordered list of independent compilation groups.
     * Modules in the same group have no dependency relationship between them
     * and can be compiled simultaneously.
     *
     * @param files - The set of files to schedule (must be registered in DependencyGraph)
     */
    topologicalGroups(files: string[]): string[][];
    /**
     * Compiles a single file via a dedicated worker thread.
     * Falls back to in-process RayCore.transform() when the worker script is missing.
     */
    private compileFile;
    /**
     * Dispatches an entire group of files to the worker pool simultaneously
     * and returns ordered { file, code, map } results.
     */
    private runGroup;
    /**
     * Main entry point: schedules files by topological level, compiles each
     * level in parallel, and optionally merges the output into a single bundle.
     */
    buildFiles(files: string[], options?: {
        minify?: boolean;
        define?: Record<string, string>;
        mergeOutput?: boolean;
    }): Promise<BatchBuildResult>;
}
//# sourceMappingURL=buildScheduler.d.ts.map