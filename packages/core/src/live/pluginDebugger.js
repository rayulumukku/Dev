/**
 * VisualPluginDebugger
 *
 * Records per-plugin transform diffs and timing from the PluginContainer
 * metrics, exposes them at /__ray/plugins/debug for Ray Studio.
 *
 * Satisfies: Observable · Plugin-driven · Benchmarkable · Zero Global State
 */
export class VisualPluginDebugger {
    records = [];
    maxRecords;
    constructor(maxRecords = 500) {
        this.maxRecords = maxRecords;
    }
    // ─────────────────────────────────────────────────────────────────────
    // Record ingestion
    // ─────────────────────────────────────────────────────────────────────
    /**
     * Record a plugin transform event. Called by PluginContainer.transform()
     * for each plugin that produced a result.
     */
    record(plugin, file, inputCode, outputCode, durationMs) {
        const diff = this.generateDiffSummary(inputCode, outputCode);
        this.records.push({
            plugin,
            file,
            durationMs: Number(durationMs.toFixed(3)),
            inputLength: inputCode.length,
            outputLength: outputCode.length,
            diff,
            timestamp: Date.now(),
        });
        if (this.records.length > this.maxRecords) {
            this.records.shift();
        }
    }
    // ─────────────────────────────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────────────────────────────
    /** Return all records, newest first */
    all() {
        return [...this.records].reverse();
    }
    /** Return records for a specific file */
    forFile(file) {
        return this.records.filter((r) => r.file === file).reverse();
    }
    /** Return records for a specific plugin */
    forPlugin(plugin) {
        return this.records.filter((r) => r.plugin === plugin).reverse();
    }
    /** Aggregate timing stats per plugin */
    pluginStats() {
        const stats = {};
        for (const r of this.records) {
            if (!stats[r.plugin])
                stats[r.plugin] = { totalMs: 0, callCount: 0 };
            stats[r.plugin].totalMs += r.durationMs;
            stats[r.plugin].callCount += 1;
        }
        return Object.fromEntries(Object.entries(stats).map(([name, s]) => [
            name,
            { ...s, avgMs: Number((s.totalMs / s.callCount).toFixed(3)) },
        ]));
    }
    // ─────────────────────────────────────────────────────────────────────
    // HTTP handler (mounted at /__ray/plugins/debug)
    // ─────────────────────────────────────────────────────────────────────
    httpHandler() {
        return (req, res) => {
            const url = new URL(req.url, 'http://localhost');
            const file = url.searchParams.get('file');
            const plugin = url.searchParams.get('plugin');
            const statsOnly = url.searchParams.get('stats') === '1';
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.statusCode = 200;
            if (statsOnly) {
                res.end(JSON.stringify({ stats: this.pluginStats() }));
                return;
            }
            if (file) {
                res.end(JSON.stringify({ records: this.forFile(file) }));
                return;
            }
            if (plugin) {
                res.end(JSON.stringify({ records: this.forPlugin(plugin) }));
                return;
            }
            res.end(JSON.stringify({ records: this.all(), stats: this.pluginStats() }));
        };
    }
    // ─────────────────────────────────────────────────────────────────────
    // Diff utility
    // ─────────────────────────────────────────────────────────────────────
    generateDiffSummary(before, after) {
        if (before === after)
            return '(no change)';
        const beforeLines = before.split('\n');
        const afterLines = after.split('\n');
        const added = afterLines.filter((l) => !beforeLines.includes(l)).length;
        const removed = beforeLines.filter((l) => !afterLines.includes(l)).length;
        const delta = after.length - before.length;
        return `+${added} lines / -${removed} lines / ${delta > 0 ? '+' : ''}${delta} bytes`;
    }
}
export const pluginDebugger = new VisualPluginDebugger();
export default pluginDebugger;
//# sourceMappingURL=pluginDebugger.js.map