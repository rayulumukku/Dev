import { describe, it, expect } from 'vitest';
import { DependencyGraph } from '../../packages/core/src/graph/index.js';

describe('DependencyGraph Unit Tests', () => {
  it('should register modules and maintain uniqueness', () => {
    const graph = new DependencyGraph();
    const m1 = graph.registerModule('/src/App.tsx', '/absolute/src/App.tsx', '/src/App.tsx');
    expect(m1.id).toBe('/src/App.tsx');

    const m2 = graph.registerModule('/src/App.tsx', '/absolute/src/App.tsx', '/src/App.tsx');
    expect(m1).toBe(m2); // Should be the exact same instance
  });

  it('should build and update dependencies correctly', () => {
    const graph = new DependencyGraph();
    const app = graph.registerModule('/src/App.tsx', '/absolute/src/App.tsx', '/src/App.tsx');
    const button = graph.registerModule('/src/Button.tsx', '/absolute/src/Button.tsx', '/src/Button.tsx');

    // Link: App -> Button
    graph.updateDependencies(
      '/src/App.tsx',
      new Set(['/src/Button.tsx']),
      (depId) => ({ file: depId, url: depId })
    );

    expect(graph.getDependencies('/src/App.tsx')).toContain('/src/Button.tsx');
    expect(graph.getImporters('/src/Button.tsx')).toContain('/src/App.tsx');

    // Update link: App no longer imports Button, imports nothing
    graph.updateDependencies('/src/App.tsx', new Set(), (depId) => ({ file: depId, url: depId }));
    expect(graph.getDependencies('/src/App.tsx').size).toBe(0);
    expect(graph.getImporters('/src/Button.tsx').size).toBe(0);
  });

  it('should invalidate transform times', () => {
    const graph = new DependencyGraph();
    const app = graph.registerModule('/src/App.tsx', '/absolute/src/App.tsx', '/src/App.tsx');
    app.lastTransformTime = 12345;
    graph.invalidate('/src/App.tsx');
    expect(app.lastTransformTime).toBe(0);
  });

  it('should serialize graph to JSON correctly', () => {
    const graph = new DependencyGraph();
    graph.registerModule('/src/App.tsx', '/absolute/src/App.tsx', '/src/App.tsx');
    graph.registerModule('/src/Button.tsx', '/absolute/src/Button.tsx', '/src/Button.tsx');
    graph.updateDependencies(
      '/src/App.tsx',
      new Set(['/src/Button.tsx']),
      (depId) => ({ file: depId, url: depId })
    );

    const json = graph.toJSON();
    expect(json.modules).toHaveLength(2);
    const appJson = json.modules.find(m => m.id === '/src/App.tsx')!;
    expect(appJson.deps).toContain('/src/Button.tsx');
    
    const buttonJson = json.modules.find(m => m.id === '/src/Button.tsx')!;
    expect(buttonJson.importers).toContain('/src/App.tsx');
  });

  it('should find registered modules via getModule', () => {
    const graph = new DependencyGraph();
    expect(graph.getModule('/src/App.tsx')).toBeUndefined();

    graph.registerModule('/src/App.tsx', '/absolute/src/App.tsx', '/src/App.tsx');
    expect(graph.getModule('/src/App.tsx')).toBeDefined();
  });

  it('should dynamically create placeholder nodes for new dependencies', () => {
    const graph = new DependencyGraph();
    graph.registerModule('/src/App.tsx', '/absolute/src/App.tsx', '/src/App.tsx');

    // Link App to a dependency that hasn't been registered yet
    graph.updateDependencies(
      '/src/App.tsx',
      new Set(['/src/NewDep.tsx']),
      (depId) => ({ file: `/abs${depId}`, url: depId })
    );

    const newDep = graph.getModule('/src/NewDep.tsx');
    expect(newDep).toBeDefined();
    expect(newDep?.file).toBe('/abs/src/NewDep.tsx');
  });
});
