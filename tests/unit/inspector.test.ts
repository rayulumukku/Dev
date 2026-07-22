import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  InspectorServer,
  InspectorAPI,
  StateStore,
  ModuleGraphView,
  PluginView,
  CacheView,
  TaskView,
  DiagnosticsView,
  EventStream,
} from '../../packages/inspector/src/index.js';

describe('Ray Developer Inspector and Debug Console (PR-45)', () => {
  let server: InspectorServer;

  beforeEach(() => {
    StateStore.clear();
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  it('1. should start inspector HTTP & WS server cleanly on localhost', async () => {
    server = new InspectorServer({ port: 4055, host: '127.0.0.1' });
    const res = await server.start();

    expect(res.port).toBe(4055);
    expect(res.url).toBe('http://127.0.0.1:4055');
  });

  it('2. should register custom inspector panels via InspectorAPI', () => {
    InspectorAPI.registerInspectorPanel({
      id: 'db-panel',
      title: 'Database Inspector',
      data: { connections: 3 },
    });

    const panel = StateStore.getPanel('db-panel');
    expect(panel).toBeDefined();
    expect(panel?.title).toBe('Database Inspector');
  });

  it('3. should format view data for module graph, plugins, cache, and tasks', () => {
    const graph = ModuleGraphView.formatGraph([{ id: 'App.tsx' }], []);
    expect(graph.totalNodes).toBe(1);

    const plugins = PluginView.formatPlugins([{ name: 'react', durationMs: 5 }]);
    expect(plugins.activeCount).toBe(1);

    const cache = CacheView.formatCache(9, 1);
    expect(cache.hitRate).toBe(0.9);

    const tasks = TaskView.formatTasks([{ id: 'web:build', status: 'completed' }]);
    expect(tasks.total).toBe(1);

    const diags = DiagnosticsView.formatDiagnostics([{ message: 'OK' }]);
    expect(diags.count).toBe(1);
  });

  it('4. should stream telemetry events via EventStream and WebSocket server', () => {
    let received = false;
    server = new InspectorServer({ port: 4056 });
    const ws = server.getWSServer();

    ws.addClient((msg) => {
      received = true;
      expect(msg.type).toBe('custom-event');
    });

    EventStream.broadcast('custom-event', { detail: 'test' });
    expect(received).toBe(true);
  });

  it('5. should export full inspector state snapshot as JSON', () => {
    InspectorAPI.publishInspectorData('session', 'test-session-123');
    const snapshot = InspectorAPI.getStateSnapshot();

    expect(snapshot).toContain('test-session-123');
  });
});
