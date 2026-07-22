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
export class StaticPerformanceAnalyzer {
    topN;
    constructor(options = {}) {
        this.topN = options.topN ?? 10;
    }
    /**
     * Analyse the full dependency graph and produce a performance report.
     *
     * @param graph - The Ray DependencyGraph instance
     * @param entryFiles - Known entry-point file paths
     */
    analyze(graph, entryFiles) {
        const modules = Array.from(graph.modules?.values?.() ?? []);
        // Pre-compute depths via BFS from each entry
        const depthMap = new Map();
        for (const entry of entryFiles) {
            this.bfsDepth(graph, entry, depthMap);
        }
        const reports = modules.map((mod) => {
            const code = mod.cachedOutput?.code ?? '';
            const estimatedBytes = Buffer.byteLength(code, 'utf-8');
            const importerCount = mod.importers?.size ?? 0;
            const dependencyCount = mod.dependencies?.size ?? 0;
            const maxDepth = depthMap.get(mod.id) ?? 0;
            const hasSyncRequire = /\brequire\s*\(/.test(code);
            const isComponent = /\.jsx$|\.tsx$/.test(mod.id) &&
                /export\s+(?:default\s+)?(?:function|const)\s+[A-Z]/.test(code);
            // Heuristic re-render risk: components with high fan-in, deep nesting, inline objects
            let rerenderRisk = 0;
            if (isComponent) {
                rerenderRisk += Math.min(importerCount * 5, 30);
                rerenderRisk += Math.min(maxDepth * 3, 20);
                rerenderRisk += (/\w+={{\s*\w+:/.test(code) ? 25 : 0); // inline props
                rerenderRisk += (/useEffect\s*\(/.test(code) ? 15 : 0);
                rerenderRisk += (/useState\s*\(/.test(code) ? 10 : 0);
                rerenderRisk = Math.min(rerenderRisk, 100);
            }
            return {
                file: mod.id,
                estimatedBytes,
                importerCount,
                dependencyCount,
                maxDepth,
                hasSyncRequire,
                isComponent,
                rerenderRisk,
            };
        });
        const totalEstimatedBytes = reports.reduce((s, r) => s + r.estimatedBytes, 0);
        const heaviestModules = [...reports]
            .sort((a, b) => b.estimatedBytes - a.estimatedBytes)
            .slice(0, this.topN);
        const hotComponents = [...reports]
            .filter((r) => r.isComponent)
            .sort((a, b) => b.rerenderRisk - a.rerenderRisk)
            .slice(0, this.topN);
        const syncRequireModules = reports.filter((r) => r.hasSyncRequire);
        return {
            modules: reports,
            totalEstimatedBytes,
            heaviestModules,
            hotComponents,
            syncRequireModules,
        };
    }
    bfsDepth(graph, startId, depthMap, depth = 0) {
        const existing = depthMap.get(startId);
        if (existing !== undefined && existing >= depth)
            return;
        depthMap.set(startId, depth);
        const deps = graph.getDependencies?.(startId) ?? new Set();
        for (const dep of deps) {
            this.bfsDepth(graph, dep, depthMap, depth + 1);
        }
    }
    /**
     * HTTP handler for /__ray/perf endpoint
     */
    httpHandler(graph, entryFiles) {
        return (_req, res) => {
            const analysis = this.analyze(graph, entryFiles);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            // Return summary only (full modules list can be large)
            res.end(JSON.stringify({
                totalEstimatedBytes: analysis.totalEstimatedBytes,
                moduleCount: analysis.modules.length,
                heaviestModules: analysis.heaviestModules,
                hotComponents: analysis.hotComponents,
                syncRequireModules: analysis.syncRequireModules.map((m) => m.file),
            }));
        };
    }
}
export default StaticPerformanceAnalyzer;
//# sourceMappingURL=staticPerformanceAnalyzer.js.map