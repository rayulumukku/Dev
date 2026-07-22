import { describe, it, expect } from 'vitest';
import { solidPlugin } from '../../packages/plugin-solid/src/SolidPlugin.js';
import { SolidCompiler } from '../../packages/plugin-solid/src/SolidCompiler.js';
import { SolidJSXTransform } from '../../packages/plugin-solid/src/JSXTransform.js';
import { SolidDependencyScanner } from '../../packages/plugin-solid/src/DependencyScanner.js';
import { SolidHMRInjector } from '../../packages/plugin-solid/src/HMR.js';
import { SolidSSRRenderer } from '../../packages/plugin-solid/src/SSR.js';

describe('Official @ray/plugin-solid Package (PR-37)', () => {
  const sampleSolidComponent = `
import { createSignal } from 'solid-js';
import Header from './Header';

export function App() {
  const [count, setCount] = createSignal(0);
  return (
    <div>
      <Header />
      <button onClick={() => setCount(count() + 1)}>Count: {count()}</button>
    </div>
  );
}
`;

  it('1. should transform Solid JSX templates into web helpers', () => {
    const transformed = SolidJSXTransform.transform(sampleSolidComponent, 'App.tsx');
    expect(transformed).toContain('solid-js/web');
  });

  it('2. should scan imports for dependency graph tracking', () => {
    const deps = SolidDependencyScanner.scan(sampleSolidComponent);
    expect(deps).toContain('solid-js');
    expect(deps).toContain('./Header');
  });

  it('3. should inject fine-grained Solid HMR runtime code', () => {
    const hmrCode = SolidHMRInjector.inject('const App = () => {};', 'App.tsx');
    expect(hmrCode).toContain('import.meta.hot');
    expect(hmrCode).toContain('Ray Solid HMR');
  });

  it('4. should compile server-side SSR renderer emitting render() helper', () => {
    const ssrCode = SolidSSRRenderer.compileSSR('const App = () => {};', 'App.tsx');
    expect(ssrCode).toContain('renderToString');
    expect(ssrCode).toContain('export function render');
  });

  it('5. should compile client DOM component with source maps', () => {
    const res = SolidCompiler.compile(sampleSolidComponent, 'App.tsx');
    expect(res.code).toContain('solid-js/web');
    expect(res.map).toBeDefined();
    expect(res.dependencies.length).toBeGreaterThan(0);
  });

  it('6. should run plugin transform hook cleanly and utilize cache & graph', async () => {
    const plugin = solidPlugin();
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

    const res1 = await plugin.transform.call(ctx, sampleSolidComponent, 'App.tsx');
    expect(res1).toBeDefined();
    expect(res1.code).toContain('solid-js');

    // Second call should hit cache
    const res2 = await plugin.transform.call(ctx, sampleSolidComponent, 'App.tsx');
    expect(res2).toBe(res1);
  });

  it('7. should handle hot update notifications', async () => {
    const plugin = solidPlugin();
    expect(typeof plugin.handleHotUpdate).toBe('function');
  });
});
