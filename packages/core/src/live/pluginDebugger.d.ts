/**
 * VisualPluginDebugger
 *
 * Records per-plugin transform diffs and timing from the PluginContainer
 * metrics, exposes them at /__ray/plugins/debug for Ray Studio.
 *
 * Satisfies: Observable · Plugin-driven · Benchmarkable · Zero Global State
 */
export interface PluginTransformRecord {
    plugin: string;
    file: string;
    durationMs: number;
    inputLength: number;
    outputLength: number;
    diff: string;
    timestamp: number;
}
export declare class VisualPluginDebugger {
    private records;
    private maxRecords;
    constructor(maxRecords?: number);
    /**
     * Record a plugin transform event. Called by PluginContainer.transform()
     * for each plugin that produced a result.
     */
    record(plugin: string, file: string, inputCode: string, outputCode: string, durationMs: number): void;
    /** Return all records, newest first */
    all(): PluginTransformRecord[];
    /** Return records for a specific file */
    forFile(file: string): PluginTransformRecord[];
    /** Return records for a specific plugin */
    forPlugin(plugin: string): PluginTransformRecord[];
    /** Aggregate timing stats per plugin */
    pluginStats(): Record<string, {
        totalMs: number;
        callCount: number;
        avgMs: number;
    }>;
    httpHandler(): (req: any, res: any) => void;
    private generateDiffSummary;
}
export declare const pluginDebugger: VisualPluginDebugger;
export default pluginDebugger;
//# sourceMappingURL=pluginDebugger.d.ts.map