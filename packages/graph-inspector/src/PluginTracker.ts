import { PluginExecutionMetric } from './types.js';

export class PluginTracker {
  private metrics = new Map<string, PluginExecutionMetric>();

  recordExecution(pluginName: string, durationMs: number): void {
    const existing = this.metrics.get(pluginName) || {
      pluginName,
      transformCount: 0,
      totalTimeMs: 0,
    };
    existing.transformCount++;
    existing.totalTimeMs += durationMs;
    this.metrics.set(pluginName, existing);
  }

  getMetrics(): PluginExecutionMetric[] {
    return Array.from(this.metrics.values());
  }
}
