import { describe, it, expect } from 'vitest';
import { comparePerformance, PerformanceMetrics } from '../../packages/core/src/benchmark/index.js';

describe('Performance Enforcer', () => {
  const dummyBaseline: PerformanceMetrics = {
    coldStart: 200,      // ms
    warmStart: 10,       // ms
    hmrLatency: 5,       // ms
    buildSpeed: 400,     // ms
    memory: 50,          // MB
    cpu: 150,            // ms
    pluginExecution: 12, // ms
    cacheHitRatio: 90,   // %
    bundleSize: 10000,   // bytes
    dependencyOptimizationTime: 50, // ms
  };

  it('should pass if there is an improvement and no regression', () => {
    const current: PerformanceMetrics = {
      ...dummyBaseline,
      buildSpeed: 350, // improved by 50ms (>20ms threshold, >5%)
    };

    const res = comparePerformance(dummyBaseline, current);
    expect(res.passed).toBe(true);
    expect(res.improved).toBe(true);
    expect(res.regressed).toBe(false);
    expect(res.improvedMetrics).toContain('Build Speed');
  });

  it('should block if there is a regression', () => {
    const current: PerformanceMetrics = {
      ...dummyBaseline,
      coldStart: 250, // regressed by 50ms (>15ms threshold, >5%)
    };

    const res = comparePerformance(dummyBaseline, current);
    expect(res.passed).toBe(false);
    expect(res.regressed).toBe(true);
    expect(res.regressedMetrics).toContain('Cold Start');
  });

  it('should block if there are no improvements, even if stable', () => {
    const current: PerformanceMetrics = { ...dummyBaseline };

    const res = comparePerformance(dummyBaseline, current);
    expect(res.passed).toBe(false);
    expect(res.improved).toBe(false);
    expect(res.regressed).toBe(false);
  });

  it('should respect absolute thresholds and not flag micro-regressions', () => {
    const current: PerformanceMetrics = {
      ...dummyBaseline,
      buildSpeed: 300,  // improved
      hmrLatency: 5.2,  // tiny micro-regression (under 5ms threshold)
      memory: 50.5,     // tiny micro-regression (under 2MB threshold)
    };

    const res = comparePerformance(dummyBaseline, current);
    expect(res.passed).toBe(true);
    expect(res.regressed).toBe(false);
  });

  it('should detect cache hit ratio improvements and regressions', () => {
    // 1. Improvement in cache hit ratio
    const betterCache: PerformanceMetrics = {
      ...dummyBaseline,
      cacheHitRatio: 95, // improved by >1%
    };
    let res = comparePerformance(dummyBaseline, betterCache);
    expect(res.passed).toBe(true);
    expect(res.improvedMetrics).toContain('Cache Hit Ratio');

    // 2. Regression in cache hit ratio
    const worseCache: PerformanceMetrics = {
      ...dummyBaseline,
      cacheHitRatio: 85, // regressed by >1%
    };
    res = comparePerformance(dummyBaseline, worseCache);
    expect(res.passed).toBe(false);
    expect(res.regressedMetrics).toContain('Cache Hit Ratio');
  });
});
