import { RawMetrics, SummaryStatistics, MetricSummaries } from './types.js';

export function calculateSummary(values: number[]): SummaryStatistics {
  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0, p95: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const sum = sorted.reduce((acc, curr) => acc + curr, 0);
  const mean = Math.round((sum / sorted.length) * 100) / 100;

  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100;

  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sorted.length;
  const stdDev = Math.round(Math.sqrt(variance) * 100) / 100;

  const p95Idx = Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1);
  const p95 = sorted[p95Idx];

  return { mean, median, min, max, stdDev, p95 };
}

export function computeMetricSummaries(rawList: RawMetrics[]): MetricSummaries {
  return {
    coldStartTime: calculateSummary(rawList.map((r) => r.coldStartTime)),
    compileTime: calculateSummary(rawList.map((r) => r.compileTime)),
    firstPageReady: calculateSummary(rawList.map((r) => r.firstPageReady)),
    buildTime: calculateSummary(rawList.map((r) => r.buildTime)),
    peakMemoryMB: calculateSummary(rawList.map((r) => r.peakMemoryMB)),
    cpuTimeMs: calculateSummary(rawList.map((r) => r.cpuTimeMs)),
    bundleSizeBytes: calculateSummary(rawList.map((r) => r.bundleSizeBytes)),
  };
}
