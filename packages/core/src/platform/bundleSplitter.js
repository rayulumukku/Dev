/**
 * AutoBundleSplitter
 *
 * Analyses the DependencyGraph to identify automatic code split points:
 * large shared modules imported by ≥ 2 independent entry points should be
 * extracted into a separate async chunk.
 *
 * Satisfies: Incremental · Cacheable · Deterministic · Observable · Zero Global State
 */
export class AutoBundleSplitter {
    /**
     * Minimum number of bytes a module must exceed to be considered for splitting.
     */
    sizeThresholdBytes;
    /**
     * Minimum number of independent importers required to qualify as a split point.
     */
    importerThreshold;
    constructor(options = {}) {
        this.sizeThresholdBytes = options.sizeThresholdBytes ?? 5_000;
        this.importerThreshold = options.importerThreshold ?? 2;
    }
    /**
     * Analyse the dependency graph and return split point recommendations.
     *
     * @param graph - The Ray DependencyGraph instance
     * @param entryFiles - The known entry-point file paths
     */
    analyze(graph, entryFiles) {
        const entrySet = new Set(entryFiles);
        const modules = Array.from(graph.modules?.values?.() ?? []);
        // Build a reachability map: entryFile → Set<file>
        const reachability = new Map();
        for (const entry of entryFiles) {
            const visited = new Set();
            this.traverse(graph, entry, visited);
            reachability.set(entry, visited);
        }
        const splitPoints = [];
        for (const mod of modules) {
            if (entrySet.has(mod.id))
                continue; // skip entries themselves
            // Count how many entries can reach this module
            let sharedByCount = 0;
            for (const [, reachable] of reachability) {
                if (reachable.has(mod.id))
                    sharedByCount++;
            }
            const src = this.estimateSize(mod);
            const recommendation = sharedByCount >= this.importerThreshold && src >= this.sizeThresholdBytes
                ? 'split'
                : 'keep';
            if (sharedByCount >= 1) {
                splitPoints.push({
                    file: mod.id,
                    sharedByCount,
                    estimatedBytes: src,
                    recommendation,
                });
            }
        }
        // Sort by savings potential
        splitPoints.sort((a, b) => b.estimatedBytes - a.estimatedBytes);
        const splits = splitPoints.filter((s) => s.recommendation === 'split');
        const estimatedSavingsBytes = splits.reduce((sum, s) => sum + s.estimatedBytes * (s.sharedByCount - 1), 0);
        return {
            splitPoints,
            totalModules: modules.length,
            recommendedSplitCount: splits.length,
            estimatedSavingsBytes,
        };
    }
    traverse(graph, fileId, visited, depth = 0) {
        if (visited.has(fileId) || depth > 100)
            return;
        visited.add(fileId);
        const deps = graph.getDependencies?.(fileId) ?? new Set();
        for (const dep of deps)
            this.traverse(graph, dep, visited, depth + 1);
    }
    estimateSize(mod) {
        if (mod.cachedOutput?.code)
            return Buffer.byteLength(mod.cachedOutput.code, 'utf-8');
        return 0;
    }
    /**
     * HTTP handler for /__ray/platform/split
     */
    httpHandler(graph, entryFiles) {
        return (_req, res) => {
            const analysis = this.analyze(graph, entryFiles);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            res.end(JSON.stringify(analysis));
        };
    }
}
export default AutoBundleSplitter;
//# sourceMappingURL=bundleSplitter.js.map