import { describe, it, expect, beforeEach } from 'vitest';
import { captureEnvironment } from '../../packages/benchmark/src/Environment.js';
import { calculateSummary, computeMetricSummaries } from '../../packages/benchmark/src/MetricsCollector.js';
import { formatReportJSON, formatReportMarkdown, formatReportHTML } from '../../packages/benchmark/src/ReportGenerator.js';
import { generateSyntheticProject } from '../../packages/benchmark/src/ProjectGenerator.js';
import { BenchmarkRunner, globalRunner } from '../../packages/benchmark/src/Runner.js';
import { executeBenchmark } from '../../packages/benchmark/src/Benchmark.js';
import fs from 'fs';
import path from 'path';

describe('Standalone Benchmarking Framework (@ray/benchmark) (PR-17)', () => {
  it('should capture host environment information accurately', () => {
    const env = captureEnvironment();

    expect(env.os).toBeDefined();
    expect(env.cpu).toBeDefined();
    expect(env.nodeVersion).toBe(process.version);
    expect(env.totalRamGB).toBeGreaterThan(0);
  });

  it('should compute statistical summary metrics (mean, median, min, max, stdDev, p95)', () => {
    const values = [10, 20, 30, 40, 50];
    const summary = calculateSummary(values);

    expect(summary.mean).toBe(30);
    expect(summary.median).toBe(30);
    expect(summary.min).toBe(10);
    expect(summary.max).toBe(50);
    expect(summary.p95).toBe(50);
  });

  it('should format reports in JSON, Markdown, and HTML formats', () => {
    const reportData = {
      environment: captureEnvironment(),
      settings: { bundlers: ['ray'], projectScale: 'small' as const, runs: 2, outputFormat: 'json' as const },
      results: {
        ray: {
          raw: [
            { coldStartTime: 100, compileTime: 120, firstPageReady: 130, buildTime: 90, peakMemoryMB: 50, cpuTimeMs: 180, bundleSizeBytes: 5000 },
            { coldStartTime: 110, compileTime: 125, firstPageReady: 135, buildTime: 95, peakMemoryMB: 52, cpuTimeMs: 190, bundleSizeBytes: 5000 },
          ],
          summary: computeMetricSummaries([
            { coldStartTime: 100, compileTime: 120, firstPageReady: 130, buildTime: 90, peakMemoryMB: 50, cpuTimeMs: 180, bundleSizeBytes: 5000 },
            { coldStartTime: 110, compileTime: 125, firstPageReady: 135, buildTime: 95, peakMemoryMB: 52, cpuTimeMs: 190, bundleSizeBytes: 5000 },
          ]),
        },
      },
      timestamp: new Date().toISOString(),
    };

    const jsonStr = formatReportJSON(reportData);
    const mdStr = formatReportMarkdown(reportData);
    const htmlStr = formatReportHTML(reportData);

    expect(jsonStr).toContain('"ray"');
    expect(mdStr).toContain('# Ray Benchmark Report');
    expect(htmlStr).toContain('<!DOCTYPE html>');
  });

  it('should register custom bundler adapters in BenchmarkRunner registry', () => {
    const runner = new BenchmarkRunner();
    runner.registerAdapter({
      name: 'mock-bundler',
      version: '1.0.0',
      setup: async () => {},
      runBuild: async () => ({
        coldStartTime: 50,
        compileTime: 60,
        firstPageReady: 70,
        buildTime: 80,
        peakMemoryMB: 30,
        cpuTimeMs: 100,
        bundleSizeBytes: 2000,
      }),
    });

    expect(runner.hasAdapter('mock-bundler')).toBe(true);
    expect(runner.getAdapter('mock-bundler')?.version).toBe('1.0.0');
  });

  it('should generate synthetic projects and execute benchmark suite clean-up', async () => {
    const report = await executeBenchmark({
      bundlers: ['ray'],
      projectScale: 'small',
      runs: 2,
      outputFormat: 'json',
    });

    expect(report.results.ray).toBeDefined();
    expect(report.results.ray.raw.length).toBe(2);
    expect(report.results.ray.summary.buildTime.mean).toBeGreaterThan(0);
  });
});
