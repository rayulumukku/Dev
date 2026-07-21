import { describe, it, expect, vi } from 'vitest';
import {
  adaptVitePlugin,
  VitePluginContainer,
  VitePluginContext
} from '../../packages/plugin-compat/src/index.js';
import { DependencyGraph } from '@ray/core';

describe('Vite Plugin Compatibility Layer Tests', () => {
  const mockRayContext = {
    projectRoot: '/test-root',
    buildMode: 'development',
    logger: {
      warn: vi.fn(),
      error: vi.fn()
    },
    graph: new DependencyGraph(),
    resolveId: async (source: string, importer?: string) => {
      if (source === 'virtual:foo') return '\0virtual:foo';
      return null;
    },
    addWatchFile: vi.fn()
  };

  it('should call resolveId hook', async () => {
    const mockVitePlugin = {
      name: 'mock-resolver',
      resolveId(id: string, importer?: string) {
        if (id === 'test-module') {
          return 'resolved-path';
        }
        return null;
      }
    };

    const adapted = adaptVitePlugin(mockVitePlugin);
    const result = await adapted.resolveId!.call(mockRayContext as any, 'test-module', undefined);
    expect(result).toBe('resolved-path');
  });

  it('should call load hook', async () => {
    const mockVitePlugin = {
      name: 'mock-loader',
      load(id: string) {
        if (id === 'target-file') {
          return 'const loaded = true;';
        }
        return null;
      }
    };

    const adapted = adaptVitePlugin(mockVitePlugin);
    const result = await adapted.load!.call(mockRayContext as any, 'target-file');
    expect(result).toBe('const loaded = true;');
  });

  it('should call transform hook', async () => {
    const mockVitePlugin = {
      name: 'mock-transformer',
      transform(code: string, id: string) {
        return code + '\n// transformed';
      }
    };

    const adapted = adaptVitePlugin(mockVitePlugin);
    const result = await adapted.transform!.call(mockRayContext as any, 'console.log("hello");', 'file.js');
    expect(result).toEqual({ code: 'console.log("hello");\n// transformed', map: undefined });
  });

  it('should support async transform', async () => {
    const mockVitePlugin = {
      name: 'mock-async-transformer',
      async transform(code: string, id: string) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(code + '\n// async-transformed');
          }, 10);
        });
      }
    };

    const adapted = adaptVitePlugin(mockVitePlugin);
    const result = await adapted.transform!.call(mockRayContext as any, 'const x = 1;', 'file.js');
    expect(result).toEqual({ code: 'const x = 1;\n// async-transformed', map: undefined });
  });

  it('should preserve transform chain order', async () => {
    const pluginA = adaptVitePlugin({
      name: 'plugin-a',
      transform(code: string) {
        return code + 'A';
      }
    });

    const pluginB = adaptVitePlugin({
      name: 'plugin-b',
      transform(code: string) {
        return code + 'B';
      }
    });

    const container = new VitePluginContainer([pluginA, pluginB], mockRayContext);
    const result = await container.transform('start', 'file.js');
    expect(result.code).toBe('startAB');
  });

  it('should call handleHotUpdate hook', async () => {
    let handleHotUpdateCalled = false;
    let receivedHmrContext: any = null;

    const mockVitePlugin = {
      name: 'mock-hmr',
      handleHotUpdate(ctx: any) {
        handleHotUpdateCalled = true;
        receivedHmrContext = ctx;
      }
    };

    const adapted = adaptVitePlugin(mockVitePlugin);
    await adapted.handleHotUpdate!.call(mockRayContext as any, { file: 'src/main.js', timestamp: 12345 });

    expect(handleHotUpdateCalled).toBe(true);
    expect(receivedHmrContext.file).toBe('src/main.js');
    expect(receivedHmrContext.timestamp).toBe(12345);
  });

  it('should bubble plugin errors with plugin name included', async () => {
    const mockVitePlugin = {
      name: 'buggy-plugin',
      transform(code: string) {
        throw new Error('transform failed');
      }
    };

    const adapted = adaptVitePlugin(mockVitePlugin);
    await expect(
      adapted.transform!.call(mockRayContext as any, 'code', 'file.js')
    ).rejects.toThrowError(/\[Plugin: buggy-plugin\] transform error: transform failed/);
  });

  it('should work with multiple plugins in container', async () => {
    const resolver = adaptVitePlugin({
      name: 'vite-resolver',
      resolveId(id: string) {
        if (id === 'foo') return 'resolved-foo';
        return null;
      }
    });

    const loader = adaptVitePlugin({
      name: 'vite-loader',
      load(id: string) {
        if (id === 'resolved-foo') return 'content-foo';
        return null;
      }
    });

    const container = new VitePluginContainer([resolver, loader], mockRayContext);
    const resolved = await container.resolveId('foo');
    expect(resolved).toBe('resolved-foo');

    const loaded = await container.load('resolved-foo');
    expect(loaded).toBe('content-foo');
  });

  it('should skip missing hooks safely', async () => {
    const sparsePlugin = adaptVitePlugin({
      name: 'sparse-plugin'
      // No hooks defined at all
    });

    // Execute adapted hooks
    const resolveRes = await sparsePlugin.resolveId?.call(mockRayContext as any, 'id', undefined);
    const loadRes = await sparsePlugin.load?.call(mockRayContext as any, 'id');
    const transformRes = await sparsePlugin.transform?.call(mockRayContext as any, 'code', 'id');
    const hmrRes = await sparsePlugin.handleHotUpdate?.call(mockRayContext as any, { file: 'file', timestamp: 1 });

    expect(resolveRes).toBeNull();
    expect(loadRes).toBeNull();
    expect(transformRes).toBeNull();
    expect(hmrRes).toBeUndefined();
  });
});
