import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ViteAdapter } from '../../packages/benchmark/src/adapters/ViteAdapter.js';
import { setupViteProject } from '../../packages/benchmark/src/adapters/ViteProject.js';
import { validateViteSetup } from '../../packages/benchmark/src/adapters/ViteValidator.js';
import { globalRunner } from '../../packages/benchmark/src/Runner.js';

const testTmpDir = path.resolve(process.cwd(), 'temp-vite-adapter-test');

function safeRmDir(dir: string) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore Windows file lock EPERM in test teardown
    }
  }
}

describe('Official Vite Benchmark Adapter (PR-20)', () => {
  beforeEach(() => {
    safeRmDir(testTmpDir);
    fs.mkdirSync(testTmpDir, { recursive: true });
  });

  afterEach(() => {
    safeRmDir(testTmpDir);
  });

  it('should implement BundlerAdapter contract and be auto-registered in globalRunner', () => {
    const adapter = globalRunner.getAdapter('vite');

    expect(adapter).toBeDefined();
    expect(adapter?.name).toBe('vite');
    expect(adapter?.version).toBe('5.0.0');
  });

  it('should automatically convert synthetic projects by generating vite.config.ts', () => {
    fs.writeFileSync(path.join(testTmpDir, 'package.json'), JSON.stringify({ name: 'test-app', scripts: {} }));

    setupViteProject(testTmpDir);

    expect(validateViteSetup(testTmpDir)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(path.join(testTmpDir, 'package.json'), 'utf-8'));
    expect(pkg.scripts.build).toBe('vite build');
  });

  it('should execute full ViteAdapter build metrics collection lifecycle', async () => {
    const adapter = new ViteAdapter();
    await adapter.setup(testTmpDir);
    const metrics = await adapter.runBuild(testTmpDir);

    expect(metrics.coldStartTime).toBeGreaterThan(0);
    expect(metrics.compileTime).toBeGreaterThan(0);
    expect(metrics.buildTime).toBeGreaterThan(0);
    expect(metrics.peakMemoryMB).toBeGreaterThan(0);
    expect(metrics.bundleSizeBytes).toBeGreaterThan(0);
  });
});
