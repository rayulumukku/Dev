import { describe, it, expect } from 'vitest';
import { PluginContainer } from '../../packages/core/src/plugin/container.js';
import { RayPlugin, PluginContext } from '../../packages/core/src/plugin/index.js';

describe('PluginContainer Unit Tests', () => {
  const dummyContext: PluginContext = {
    projectRoot: '/root',
    resolver: {} as any,
    graph: {} as any,
    logger: console,
    buildMode: 'development',
    emitFile: () => {},
    addWatchFile: () => {},
    resolveId: async (id) => id,
  };

  it('should enforce plugin execution order (pre, normal, post)', async () => {
    const trace: string[] = [];

    const pPre: RayPlugin = {
      name: 'pre-plugin',
      enforce: 'pre',
      buildStart() {
        trace.push('pre');
      },
    };

    const pNormal: RayPlugin = {
      name: 'normal-plugin',
      buildStart() {
        trace.push('normal');
      },
    };

    const pPost: RayPlugin = {
      name: 'post-plugin',
      enforce: 'post',
      buildStart() {
        trace.push('post');
      },
    };

    const container = new PluginContainer([pPost, pPre, pNormal], dummyContext);
    await container.buildStart();

    expect(trace).toEqual(['pre', 'normal', 'post']);
  });

  it('should chain transform hooks sequentially', async () => {
    const p1: RayPlugin = {
      name: 'p1',
      transform(code) {
        return code + ' + p1';
      },
    };

    const p2: RayPlugin = {
      name: 'p2',
      transform(code) {
        return { code: code + ' + p2' };
      },
    };

    const container = new PluginContainer([p1, p2], dummyContext);
    const result = await container.transform('input', 'file.js');
    expect(result.code.trim().replace(/;$/, '')).toBe('input + p1 + p2');
  });

  it('should accumulate execution metrics', async () => {
    const p1: RayPlugin = {
      name: 'time-waster',
      resolveId(id) {
        // Mock execution delay
        return id;
      },
    };

    const container = new PluginContainer([p1], dummyContext);
    await container.resolveId('test');
    expect(container.metrics.get('time-waster')).toBeGreaterThanOrEqual(0);
  });

  it('should run bundle lifecycle hooks (handleHotUpdate, buildEnd, generateBundle, closeBundle)', async () => {
    let lifecycleRuns: string[] = [];

    const p: RayPlugin = {
      name: 'lifecycle-plugin',
      handleHotUpdate() {
        lifecycleRuns.push('handleHotUpdate');
      },
      buildEnd() {
        lifecycleRuns.push('buildEnd');
      },
      generateBundle() {
        lifecycleRuns.push('generateBundle');
      },
      closeBundle() {
        lifecycleRuns.push('closeBundle');
      },
    };

    const container = new PluginContainer([p], dummyContext);
    await container.handleHotUpdate({ file: 'foo.js', timestamp: 123 });
    await container.buildEnd();
    await container.generateBundle({});
    await container.closeBundle();

    expect(lifecycleRuns).toEqual([
      'handleHotUpdate',
      'buildEnd',
      'generateBundle',
      'closeBundle',
    ]);
  });

  it('should run load hook when present', async () => {
    const p: RayPlugin = {
      name: 'load-plugin',
      load(id) {
        if (id === 'virtual:mod') {
          return 'export const val = 42;';
        }
        return null;
      },
    };

    const container = new PluginContainer([p], dummyContext);
    const result = await container.load('virtual:mod');
    expect(result).toBe('export const val = 42;');

    const nullResult = await container.load('other');
    expect(nullResult).toBeNull();
  });
});
