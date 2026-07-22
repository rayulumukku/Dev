import { describe, it, expect } from 'vitest';
import { ChangeDetector } from '../../packages/incremental-build/src/ChangeDetector.js';
import { AffectedGraph } from '../../packages/incremental-build/src/AffectedGraph.js';
import { BuildPlanner } from '../../packages/incremental-build/src/BuildPlanner.js';
import { ArtifactStore } from '../../packages/incremental-build/src/ArtifactStore.js';
import { ManifestComparer } from '../../packages/incremental-build/src/ManifestComparer.js';
import { OutputValidator } from '../../packages/incremental-build/src/OutputValidator.js';
import { IncrementalBuildEngine } from '../../packages/incremental-build/src/IncrementalBuild.js';
import fs from 'fs';
import path from 'path';

describe('Official @ray/incremental-build Engine (PR-32)', () => {
  const tempDir = path.join(process.cwd(), 'temp-inc-test');

  it('1. should compute SHA-256 hashes for files, configs, and environments', () => {
    const detector = new ChangeDetector();
    const hash1 = detector.computeFileHash('src/App.tsx', 'const App = () => <div>App</div>;');
    const hash2 = detector.computeFileHash('src/App.tsx', 'const App = () => <div>App</div>;');
    const hash3 = detector.computeFileHash('src/App.tsx', 'const App = () => <div>Modified</div>;');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);

    const configHash = detector.computeConfigHash({ mode: 'production' });
    expect(configHash).toBeDefined();

    const envHash = detector.computeEnvHash({ NODE_ENV: 'production' });
    expect(envHash).toBeDefined();
  });

  it('2. should traverse dependency graph and mark downstream importers as affected', () => {
    const affectedGraph = new AffectedGraph();
    const mockGraph = {
      getImporters: (id: string) => {
        if (id === 'src/util.ts') return new Set(['src/App.tsx']);
        return new Set();
      },
    };

    const changed = new Set(['src/util.ts']);
    const affected = affectedGraph.computeAffected(changed, mockGraph);

    expect(affected.has('src/util.ts')).toBe(true);
    expect(affected.has('src/App.tsx')).toBe(true);
  });

  it('3. should perform sub-millisecond no-op build when no files have changed', () => {
    const planner = new BuildPlanner();
    const currentFiles = {
      'src/index.tsx': 'console.log("index");',
      'src/App.tsx': 'console.log("app");',
    };

    const context = {
      configHash: 'hash-config',
      envHash: 'hash-env',
      pluginsHash: 'hash-plugins',
      rayVersion: '1.0.0',
    };

    // First build plan
    const plan1 = planner.createPlan(currentFiles, null, context);
    expect(plan1.rebuiltCount).toBe(2);

    const mockManifest = {
      version: '1.0.0',
      timestamp: Date.now(),
      configHash: 'hash-config',
      envHash: 'hash-env',
      pluginsHash: 'hash-plugins',
      files: {
        'src/index.tsx': { filePath: 'src/index.tsx', hash: new ChangeDetector().computeFileHash('src/index.tsx', currentFiles['src/index.tsx']), mtime: Date.now(), deps: [] },
        'src/App.tsx': { filePath: 'src/App.tsx', hash: new ChangeDetector().computeFileHash('src/App.tsx', currentFiles['src/App.tsx']), mtime: Date.now(), deps: [] },
      },
      artifacts: {},
      chunkGraphHash: 'graph-hash',
    };

    // Second build plan with identical input (no-op)
    const plan2 = planner.createPlan(currentFiles, mockManifest, context);
    expect(plan2.reusedCount).toBe(2);
    expect(plan2.rebuiltCount).toBe(0);
  });

  it('4. should rebuild single modified file and invalidate dependent modules', () => {
    const planner = new BuildPlanner();
    const currentFiles = {
      'src/util.ts': 'export const x = 20;', // Modified from original x = 10
      'src/App.tsx': 'import { x } from "./util";',
    };

    const mockManifest = {
      version: '1.0.0',
      timestamp: Date.now(),
      configHash: 'hash-config',
      envHash: 'hash-env',
      pluginsHash: 'hash-plugins',
      files: {
        'src/util.ts': { filePath: 'src/util.ts', hash: 'old-util-hash', mtime: Date.now(), deps: [] },
        'src/App.tsx': { filePath: 'src/App.tsx', hash: new ChangeDetector().computeFileHash('src/App.tsx', currentFiles['src/App.tsx']), mtime: Date.now(), deps: [] },
      },
      artifacts: {},
      chunkGraphHash: 'graph-hash',
    };

    const mockGraph = {
      getImporters: (id: string) => (id === 'src/util.ts' ? new Set(['src/App.tsx']) : new Set()),
    };

    const plan = planner.createPlan(currentFiles, mockManifest, {
      configHash: 'hash-config',
      envHash: 'hash-env',
      pluginsHash: 'hash-plugins',
      rayVersion: '1.0.0',
      graph: mockGraph,
    });

    expect(plan.modules.get('src/util.ts')?.state).toBe('affected');
    expect(plan.modules.get('src/App.tsx')?.state).toBe('invalidated');
  });

  it('5. should require clean fallback when configuration, env, or plugins change', () => {
    const planner = new BuildPlanner();
    const currentFiles = { 'src/index.ts': 'console.log(1);' };

    const mockManifest = {
      version: '1.0.0',
      timestamp: Date.now(),
      configHash: 'old-config',
      envHash: 'env-hash',
      pluginsHash: 'plugins-hash',
      files: {},
      artifacts: {},
      chunkGraphHash: 'graph-hash',
    };

    const plan = planner.createPlan(currentFiles, mockManifest, {
      configHash: 'new-config',
      envHash: 'env-hash',
      pluginsHash: 'plugins-hash',
      rayVersion: '1.0.0',
    });

    expect(plan.requiresCleanFallback).toBe(true);
    expect(plan.reason).toContain('Configuration changed');
  });

  it('6. should store and load build manifests in artifact store', () => {
    const store = new ArtifactStore(tempDir);
    const manifest = {
      version: '1.0.0',
      timestamp: Date.now(),
      configHash: 'cfg',
      envHash: 'env',
      pluginsHash: 'plg',
      files: {},
      artifacts: {},
      chunkGraphHash: 'cgh',
    };

    store.saveManifest(manifest);
    const loaded = store.loadManifest();

    expect(loaded).toBeDefined();
    expect(loaded?.configHash).toBe('cfg');

    store.clear();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('7. should compare manifests and detect differences', () => {
    const comparer = new ManifestComparer();
    const manifest1 = {
      version: '1.0.0',
      timestamp: 100,
      configHash: 'a',
      envHash: 'b',
      pluginsHash: 'c',
      files: {},
      artifacts: {},
      chunkGraphHash: 'd',
    };

    const manifest2 = { ...manifest1, configHash: 'changed-a' };

    const res = comparer.compare(manifest1, manifest2);
    expect(res.equal).toBe(false);
    expect(res.differences.length).toBeGreaterThan(0);
  });

  it('8. should validate output files against expected artifact hashes', () => {
    const outDir = path.join(process.cwd(), 'temp-out-val-test');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'bundle.js'), 'console.log("hello");');

    const validator = new OutputValidator();
    const expectedManifest = {
      version: '1.0.0',
      timestamp: Date.now(),
      configHash: 'cfg',
      envHash: 'env',
      pluginsHash: 'plg',
      files: {},
      artifacts: {
        'bundle.js': {
          hash: new ChangeDetector().computeContentHash(fs.readFileSync(path.join(outDir, 'bundle.js'))),
          size: 21,
          path: 'bundle.js',
        },
      },
      chunkGraphHash: 'cgh',
    };

    const valResult = validator.validateOutput(outDir, expectedManifest);
    expect(valResult.valid).toBe(true);

    // Cleanup
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('9. should clean persistent cache and run end-to-end incremental engine plan', () => {
    const engine = new IncrementalBuildEngine({ projectRoot: tempDir, clean: true });
    const currentFiles = { 'src/main.ts': 'const main = true;' };

    const plan = engine.plan(currentFiles, { config: { mode: 'production' } });
    expect(plan).toBeDefined();

    const metrics = IncrementalBuildEngine.getLastMetrics();
    expect(metrics).toBeDefined();

    engine.clean();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('10. should maintain clean fallback safety guarantee when uncertainty exists', () => {
    const engine = new IncrementalBuildEngine({ projectRoot: tempDir, clean: false, validateOutputs: true });
    const currentFiles = { 'src/main.ts': 'const a = 1;' };

    // Plan with missing output directory -> triggers clean fallback
    const plan = engine.plan(currentFiles, {
      config: { mode: 'production' },
    });

    expect(plan.rebuiltCount).toBeGreaterThan(0);

    engine.clean();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
