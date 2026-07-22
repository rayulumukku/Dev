import { describe, it, expect, vi } from 'vitest';
import { DependencyGraph } from '../../packages/core/src/graph/index.js';
import { PluginContainer, RayPlugin } from '../../packages/core/src/plugins/index.js';
import { graphLoggerPlugin } from '../../packages/examples/graph-logger/index.js';

describe('Dependency Graph Plugin API & Events (PR-06)', () => {
  it('should emit onModuleDiscovered when a new module is registered', async () => {
    let discoveredModule: any = null;

    const listenerPlugin: RayPlugin = {
      name: 'module-listener',
      onModuleDiscovered(module) {
        discoveredModule = module;
      },
    };

    const container = new PluginContainer([listenerPlugin]);
    const graph = new DependencyGraph({ pluginContainer: container });

    graph.registerModule('/app/main.js', '/app/main.js', '/src/main.js');

    // Give microtasks time to execute
    await new Promise((r) => setTimeout(r, 10));

    expect(discoveredModule).not.toBeNull();
    expect(discoveredModule.id).toBe('/app/main.js');
    expect(discoveredModule.file).toBe('/app/main.js');
    expect(discoveredModule.url).toBe('/src/main.js');
    // Ensure snapshot is read-only
    expect(Object.isFrozen(discoveredModule)).toBe(true);
  });

  it('should emit onDependencyResolved when dependency edges are updated', async () => {
    const resolvedEdges: Array<{ from: string; to: string }> = [];

    const listenerPlugin: RayPlugin = {
      name: 'edge-listener',
      onDependencyResolved(edge) {
        resolvedEdges.push(edge);
      },
    };

    const container = new PluginContainer([listenerPlugin]);
    const graph = new DependencyGraph({ pluginContainer: container });

    graph.registerModule('/app/main.js', '/app/main.js', '/src/main.js');

    const deps = new Set(['/app/utils.js']);
    graph.updateDependencies('/app/main.js', deps, (id) => ({
      file: id,
      url: `/src/${id.split('/').pop()}`,
    }));

    await new Promise((r) => setTimeout(r, 10));

    expect(resolvedEdges).toHaveLength(1);
    expect(resolvedEdges[0]).toEqual({ from: '/app/main.js', to: '/app/utils.js' });
  });

  it('should emit onGraphInvalidated when a module is invalidated', async () => {
    let invalidatedNode: any = null;

    const listenerPlugin: RayPlugin = {
      name: 'invalidation-listener',
      onGraphInvalidated(module) {
        invalidatedNode = module;
      },
    };

    const container = new PluginContainer([listenerPlugin]);
    const graph = new DependencyGraph({ pluginContainer: container });

    graph.registerModule('/app/main.js', '/app/main.js', '/src/main.js');
    graph.invalidate('/app/main.js');

    await new Promise((r) => setTimeout(r, 10));

    expect(invalidatedNode).not.toBeNull();
    expect(invalidatedNode.id).toBe('/app/main.js');
  });

  it('should emit onGraphUpdated when dependencies are updated', async () => {
    let graphSnapshot: any = null;

    const listenerPlugin: RayPlugin = {
      name: 'graph-update-listener',
      onGraphUpdated(snapshot) {
        graphSnapshot = snapshot;
      },
    };

    const container = new PluginContainer([listenerPlugin]);
    const graph = new DependencyGraph({ pluginContainer: container });

    graph.registerModule('/app/main.js', '/app/main.js', '/src/main.js');
    graph.updateDependencies('/app/main.js', new Set(['/app/a.js', '/app/b.js']), (id) => ({
      file: id,
      url: `/src/${id}`,
    }));

    await new Promise((r) => setTimeout(r, 10));

    expect(graphSnapshot).not.toBeNull();
    expect(graphSnapshot.size).toBe(3); // main.js + a.js + b.js
  });

  it('should support async graph hooks', async () => {
    let asyncDiscovered = false;

    const asyncPlugin: RayPlugin = {
      name: 'async-graph-plugin',
      async onModuleDiscovered(module) {
        await new Promise((r) => setTimeout(r, 15));
        asyncDiscovered = true;
      },
    };

    const container = new PluginContainer([asyncPlugin]);
    const graph = new DependencyGraph({ pluginContainer: container });

    graph.registerModule('/app/async.js', '/app/async.js', '/src/async.js');
    await new Promise((r) => setTimeout(r, 30));

    expect(asyncDiscovered).toBe(true);
  });

  it('should work with multiple plugins listening to graph events', async () => {
    const eventsA: string[] = [];
    const eventsB: string[] = [];

    const pluginA: RayPlugin = {
      name: 'plugin-a',
      onModuleDiscovered(mod) {
        eventsA.push(`A:${mod.id}`);
      },
    };

    const pluginB: RayPlugin = {
      name: 'plugin-b',
      onModuleDiscovered(mod) {
        eventsB.push(`B:${mod.id}`);
      },
    };

    const container = new PluginContainer([pluginA, pluginB]);
    const graph = new DependencyGraph({ pluginContainer: container });

    graph.registerModule('/app/foo.js', '/app/foo.js', '/src/foo.js');
    await new Promise((r) => setTimeout(r, 10));

    expect(eventsA).toEqual(['A:/app/foo.js']);
    expect(eventsB).toEqual(['B:/app/foo.js']);
  });

  it('should respect plugin enforce ordering for graph events', async () => {
    const orderLog: string[] = [];

    const normalPlugin: RayPlugin = {
      name: 'normal-plugin',
      onModuleDiscovered() {
        orderLog.push('normal');
      },
    };

    const prePlugin: RayPlugin = {
      name: 'pre-plugin',
      enforce: 'pre',
      onModuleDiscovered() {
        orderLog.push('pre');
      },
    };

    const postPlugin: RayPlugin = {
      name: 'post-plugin',
      enforce: 'post',
      onModuleDiscovered() {
        orderLog.push('post');
      },
    };

    const container = new PluginContainer([normalPlugin, postPlugin, prePlugin]);
    const graph = new DependencyGraph({ pluginContainer: container });

    graph.registerModule('/app/test.js', '/app/test.js', '/src/test.js');
    await new Promise((r) => setTimeout(r, 10));

    expect(orderLog).toEqual(['pre', 'normal', 'post']);
  });

  it('should bubble plugin errors with plugin name included during graph event execution', async () => {
    const errorPlugin: RayPlugin = {
      name: 'error-graph-plugin',
      onModuleDiscovered() {
        throw new Error('Graph event processing failed');
      },
    };

    const container = new PluginContainer([errorPlugin]);
    await expect(container.onModuleDiscovered({ id: 'test' } as any)).rejects.toThrowError(
      /\[Plugin: error-graph-plugin\] onModuleDiscovered error: Graph event processing failed/
    );
  });

  it('should run zero-plugin fast path with zero overhead when no graph plugins are registered', () => {
    const graph = new DependencyGraph(); // No plugins
    const node = graph.registerModule('/app/zero.js', '/app/zero.js', '/src/zero.js');
    expect(node.id).toBe('/app/zero.js');
  });

  it('should execute graph logger example plugin successfully', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const examplePlugin = graphLoggerPlugin({ prefix: '[Test]' });
    const container = new PluginContainer([examplePlugin]);
    const graph = new DependencyGraph({ pluginContainer: container });

    graph.registerModule('/app/example.js', '/app/example.js', '/src/example.js');
    await new Promise((r) => setTimeout(r, 10));

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Test] New Module: /app/example.js'));

    consoleSpy.mockRestore();
  });
});
