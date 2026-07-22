import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { RayAdapter } from '../../packages/benchmark/src/adapters/RayAdapter.js';
import { measureColdStart } from '../../packages/benchmark/src/adapters/StartupRunner.js';
import { measureHMRLatency } from '../../packages/benchmark/src/adapters/HMRLatency.js';
import { calculateBundleSize } from '../../packages/benchmark/src/adapters/BuildRunner.js';
import { globalRunner } from '../../packages/benchmark/src/Runner.js';

const testTmpDir = path.resolve(process.cwd(), 'temp-ray-adapter-test');

describe('Official Ray Benchmark Adapter (PR-19)', () => {
  beforeEach(() => {
    if (fs.existsSync(testTmpDir)) {
      fs.rmSync(testTmpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testTmpDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testTmpDir)) {
      fs.rmSync(testTmpDir, { recursive: true, force: true });
    }
  });

  it('should implement BundlerAdapter contract and be auto-registered in globalRunner', () => {
    const adapter = globalRunner.getAdapter('ray');

    expect(adapter).toBeDefined();
    expect(adapter?.name).toBe('ray');
    expect(adapter?.version).toBe('1.0.0');
  });

  it('should measure cold start time using process timing', async () => {
    const coldStart = await measureColdStart(testTmpDir);
    expect(coldStart).toBeGreaterThan(0);
  });

  it('should measure HMR latency on source file edits', async () => {
    const srcDir = path.join(testTmpDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    const sampleFile = path.join(srcDir, 'App.tsx');
    fs.writeFileSync(sampleFile, 'export function App() { return <div>App</div>; }');

    const latency = await measureHMRLatency(testTmpDir, 'src/App.tsx');
    expect(latency).toBeGreaterThan(0);
  });

  it('should calculate production bundle sizes from output directory', () => {
    const distDir = path.join(testTmpDir, 'dist');
    fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, 'index.js'), 'console.log("dist build");');

    const size = calculateBundleSize(distDir);
    expect(size).toBeGreaterThan(0);
  });

  it('should execute full RayAdapter build metrics collection lifecycle', async () => {
    const adapter = new RayAdapter();
    await adapter.setup(testTmpDir);
    const metrics = await adapter.runBuild(testTmpDir);

    expect(metrics.coldStartTime).toBeGreaterThan(0);
    expect(metrics.compileTime).toBeGreaterThan(0);
    expect(metrics.buildTime).toBeGreaterThan(0);
    expect(metrics.peakMemoryMB).toBeGreaterThan(0);
    expect(metrics.bundleSizeBytes).toBeGreaterThan(0);
  });
});
