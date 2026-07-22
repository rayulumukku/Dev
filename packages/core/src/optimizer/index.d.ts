import { Resolver } from '../resolver/index.js';
interface OptimizerOptions {
    force?: boolean;
    clear?: boolean;
}
interface OptimizerResult {
    optimized: Record<string, string>;
    cacheHits: number;
    cacheMisses: number;
    optimizationTimeMs: number;
    scanTimeMs: number;
    coldStart: boolean;
}
export declare class OptimizerGraph {
    nodes: Map<string, {
        status: 'clean' | 'dirty' | 'rebuilding' | 'failed';
        hash: string;
        deps: string[];
    }>;
    register(dep: string, hash: string, deps: string[]): void;
    markDirty(dep: string): void;
    getStatus(dep: string): 'clean' | 'dirty' | 'rebuilding' | 'failed';
}
/**
 * Recursively scans entry scripts for bare module imports using es-module-lexer.
 */
export declare function scanDeps(projectRoot: string, resolver: Resolver, include?: string[], exclude?: string[]): Promise<Set<string>>;
/**
 * Runs the optimization pipeline scanning, pre-bundling, and caching packages.
 */
export declare function runOptimizer(projectRoot: string, config: any, resolver: Resolver, options?: OptimizerOptions): Promise<OptimizerResult>;
export {};
//# sourceMappingURL=index.d.ts.map