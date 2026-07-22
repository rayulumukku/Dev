import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildInspectorNode } from '../../packages/graph-inspector/src/NodeBuilder.js';
import { buildInspectorEdge } from '../../packages/graph-inspector/src/EdgeBuilder.js';
import { GraphSerializer } from '../../packages/graph-inspector/src/GraphSerializer.js';
import { HMRTracker } from '../../packages/graph-inspector/src/HMRTracker.js';
import { PluginTracker } from '../../packages/graph-inspector/src/PluginTracker.js';
import { GraphInspectorServer } from '../../packages/graph-inspector/src/Server.js';

describe('Ray Dependency Graph Inspector (PR-25)', () => {
  it('should categorize nodes correctly based on file extensions', () => {
    expect(buildInspectorNode('App.tsx').type).toBe('react');
    expect(buildInspectorNode('Component.vue').type).toBe('vue');
    expect(buildInspectorNode('style.css').type).toBe('css');
    expect(buildInspectorNode('packages/ui/index.ts').type).toBe('workspace');
  });

  it('should serialize nodes, edges, and detect circular dependencies correctly', () => {
    const serializer = new GraphSerializer();

    serializer.addNode(buildInspectorNode('A.ts'));
    serializer.addNode(buildInspectorNode('B.ts'));
    serializer.addNode(buildInspectorNode('C.ts'));

    serializer.addEdge(buildInspectorEdge('A.ts', 'B.ts'));
    serializer.addEdge(buildInspectorEdge('B.ts', 'C.ts'));
    serializer.addEdge(buildInspectorEdge('C.ts', 'A.ts'));

    const cycles = serializer.detectCircularDependencies();
    expect(cycles.length).toBe(1);
    expect(cycles[0].cycle).toContain('A.ts');
    expect(cycles[0].suggestedBreakPoint).toBeDefined();

    const json = JSON.parse(serializer.toJSON());
    expect(json.nodes.length).toBe(3);
    expect(json.edges.length).toBe(3);
  });

  it('should record HMR update events and plugin transform metrics', () => {
    const hmr = new HMRTracker();
    const event = hmr.recordEvent('src/App.tsx', ['src/App.tsx', 'src/main.tsx']);

    expect(event.editedFile).toBe('src/App.tsx');
    expect(event.invalidatedModules.length).toBe(2);

    const plugin = new PluginTracker();
    plugin.recordExecution('ray:vue', 15);
    plugin.recordExecution('ray:vue', 25);

    const metrics = plugin.getMetrics();
    expect(metrics[0].pluginName).toBe('ray:vue');
    expect(metrics[0].transformCount).toBe(2);
    expect(metrics[0].totalTimeMs).toBe(40);
  });

  it('should initialize and start the GraphInspectorServer cleanly', async () => {
    const server = new GraphInspectorServer({ port: 4099 });
    await server.start();
    await server.stop();
  });
});
