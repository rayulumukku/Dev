import { describe, it, expect } from 'vitest';
import { sveltePlugin } from '../../packages/plugin-svelte/src/SveltePlugin.js';
import { SvelteCompiler } from '../../packages/plugin-svelte/src/SvelteCompiler.js';
import { SvelteDescriptorParser } from '../../packages/plugin-svelte/src/Descriptor.js';
import { SvelteDependencyScanner } from '../../packages/plugin-svelte/src/DependencyScanner.js';
import { SvelteCSSProcessor } from '../../packages/plugin-svelte/src/CSSProcessor.js';

describe('Official @ray/plugin-svelte Package (PR-36)', () => {
  const sampleComponent = `
<script>
  import Counter from './Counter.svelte';
  let count = 0;
</script>

<main>
  <h1>Hello Svelte</h1>
  <Counter />
</main>

<style>
  h1 { color: red; }
</style>
`;

  it('1. should parse descriptor into script, template, and style blocks', () => {
    const desc = SvelteDescriptorParser.parse(sampleComponent);
    expect(desc.script).toBeDefined();
    expect(desc.script?.code).toContain('let count = 0;');
    expect(desc.template.code).toContain('<h1>Hello Svelte</h1>');
    expect(desc.style?.code).toContain('color: red;');
  });

  it('2. should scan imports and dependencies for dependency graph', () => {
    const deps = SvelteDependencyScanner.scan(sampleComponent);
    expect(deps).toContain('./Counter.svelte');
  });

  it('3. should process styles and generate element injection JS', () => {
    const jsStyle = SvelteCSSProcessor.processStyle('h1 { color: red; }', 'App.svelte');
    expect(jsStyle).toContain('document.createElement(\'style\')');
    expect(jsStyle).toContain('color: red;');
  });

  it('4. should compile client component with HMR injection and source map', () => {
    const res = SvelteCompiler.compile(sampleComponent, 'App.svelte');

    expect(res.js.code).toContain('class Component');
    expect(res.js.code).toContain('import.meta.hot');
    expect(res.js.map).toBeDefined();
    expect(res.css?.code).toContain('color: red;');
  });

  it('5. should compile SSR component emitting render() method for SSG', () => {
    const res = SvelteCompiler.compile(sampleComponent, 'App.svelte', { isServer: true });

    expect(res.js.code).toContain('export default {');
    expect(res.js.code).toContain('render(props = {})');
    expect(res.js.code).toContain('class="svelte-ssr"');
  });

  it('6. should run transform hook cleanly and utilize cache & graph', async () => {
    const plugin = sveltePlugin();
    const mockCache = new Map<string, any>();
    const mockGraph = { addDependency: (src: string, dep: string) => {} };

    const ctx = {
      buildMode: 'development',
      cache: {
        get: (k: string) => mockCache.get(k),
        set: (k: string, v: any) => mockCache.set(k, v),
      },
      graph: mockGraph,
    };

    const res1 = await plugin.transform.call(ctx, sampleComponent, 'App.svelte');
    expect(res1).toBeDefined();
    expect(res1.code).toContain('class Component');

    // Second call should hit cache
    const res2 = await plugin.transform.call(ctx, sampleComponent, 'App.svelte');
    expect(res2).toBe(res1);
  });

  it('7. should handle hot update notifications', async () => {
    const plugin = sveltePlugin();
    expect(typeof plugin.handleHotUpdate).toBe('function');
  });
});
