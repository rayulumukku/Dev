export class PluginTracker {
  constructor() {
    this.metrics = new Map();
  }

  recordExecution(pluginName, durationMs) {
    const existing = this.metrics.get(pluginName) || {
      pluginName,
      transformCount: 0,
      totalTimeMs: 0,
    };
    existing.transformCount++;
    existing.totalTimeMs += durationMs;
    this.metrics.set(pluginName, existing);
  }

  getMetrics() {
    return Array.from(this.metrics.values());
  }
}
