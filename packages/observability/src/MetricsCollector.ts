import { MetricsData } from './types.js';

export class MetricsCollector {
  private static metrics: MetricsData = {
    buildDurationMs: 0,
    transformDurationMs: 0,
    cacheHitRatio: 1.0,
    memoryUsageMb: 45,
    hmrLatencyMs: 2,
  };

  static recordMetric(key: keyof MetricsData, value: number): void {
    (this.metrics as any)[key] = value;
  }

  static getMetrics(): MetricsData {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.metrics.memoryUsageMb = Math.round(process.memoryUsage().rss / (1024 * 1024));
    }
    return this.metrics;
  }

  static clear(): void {
    this.metrics = {
      buildDurationMs: 0,
      transformDurationMs: 0,
      cacheHitRatio: 1.0,
      memoryUsageMb: 45,
      hmrLatencyMs: 2,
    };
  }
}
