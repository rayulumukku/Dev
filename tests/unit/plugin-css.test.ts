import { describe, it, expect, beforeEach } from 'vitest';
import { processCSS } from '../../packages/plugin-css/src/CSSPipeline.js';
import { CSSCache, globalCSSCache } from '../../packages/plugin-css/src/CSSCache.js';
import { CSSModuleGraph, globalCSSModuleGraph } from '../../packages/plugin-css/src/CSSModuleGraph.js';
import { generateCSSHMR } from '../../packages/plugin-css/src/HMR.js';
import cssPlugin from '../../packages/plugin-css/src/CSSPlugin.js';
import { PluginContainer } from '../../packages/core/src/plugins/index.js';
import { transformFile } from '../../packages/transform/src/index.js';

describe('Plugin-Based CSS Pipeline (@ray/plugin-css) (PR-10)', () => {
  beforeEach(() => {
    globalCSSCache.clear();
    globalCSSModuleGraph.clear();
  });

  const sampleCSS = `
@import "./theme.css";
body {
  margin: 0;
  color: red;
}
  `;

  it('should process CSS file and extract @import dependencies', () => {
    const result = processCSS(sampleCSS, 'base.css');

    expect(result.code).toContain('color: red;');
    expect(result.imports).toEqual(['./theme.css']);
    expect(result.jsCode).toContain('document.createElement(\'style\')');
    expect(result.jsCode).toContain('data-ray-css');
  });

  it('should maintain in-memory CSS cache and support invalidation', () => {
    const cache = new CSSCache();
    cache.set('style.css', {
      filename: 'style.css',
      code: 'body { color: blue; }',
      imports: [],
      mtime: 1000,
      hash: 'abc',
    });

    expect(cache.get('style.css')?.code).toBe('body { color: blue; }');

    cache.invalidate('style.css');
    expect(cache.get('style.css')).toBeUndefined();
  });

  it('should track nested @import dependency relationships in CSSModuleGraph', () => {
    const graph = new CSSModuleGraph();
    graph.addDependency('base.css', 'theme.css');
    graph.addDependency('base.css', 'variables.css');

    expect(graph.getDependencies('base.css')).toEqual(['theme.css', 'variables.css']);
  });

  it('should generate in-place CSS HMR acceptance snippet', () => {
    const hmr = generateCSSHMR('base.css');

    expect(hmr).toContain('import.meta.hot.accept');
    expect(hmr).toContain('data-ray-css');
    expect(hmr).toContain('base.css');
  });

  it('should register cssPlugin with PluginContainer', () => {
    const plugin = cssPlugin();
    const container = new PluginContainer([plugin]);

    expect(container.getPlugins()).toHaveLength(1);
    expect(container.getPlugins()[0].name).toBe('@ray/plugin-css');
  });

  it('should resolve and transform .css files through Ray transform pipeline', async () => {
    const plugin = cssPlugin();
    const container = new PluginContainer([plugin]);

    const res = await transformFile('h1 { font-size: 24px; }', 'style.css', {
      pluginContainer: container,
    });

    expect(res.code).toContain('document.createElement(\'style\')');
    expect(res.code).toContain('import.meta.hot.accept');
  });

  it('should support multiple CSS entry points cleanly', async () => {
    const plugin = cssPlugin();
    const container = new PluginContainer([plugin]);

    const res1 = await transformFile('.a { color: red; }', 'a.css', { pluginContainer: container });
    const res2 = await transformFile('.b { color: blue; }', 'b.css', { pluginContainer: container });

    expect(res1.code).toContain('a.css');
    expect(res2.code).toContain('b.css');
  });
});
