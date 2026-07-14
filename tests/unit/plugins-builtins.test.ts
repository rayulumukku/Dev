import { describe, it, expect } from 'vitest';
import path from 'path';
import { cssPlugin } from '../../packages/core/src/plugin/builtins/cssPlugin.js';
import { hmrPlugin } from '../../packages/core/src/plugin/builtins/hmrPlugin.js';
import { DependencyGraph } from '../../packages/core/src/graph/index.js';

describe('Builtin CSS & HMR Plugins Unit Tests', () => {
  const dummyContext = {
    projectRoot: process.cwd(),
    graph: new DependencyGraph(),
    resolveId: async (id: string) => id,
    buildMode: 'development'
  } as any;

  describe('cssPlugin', () => {
    const plugin = cssPlugin();

    it('should ignore non-css requests', async () => {
      const res = await plugin.transform!.call(dummyContext, 'body { color: red; }', 'style.js');
      expect(res).toBeNull();
    });

    it('should ignore CSS requests without ?import suffix', async () => {
      const res = await plugin.transform!.call(dummyContext, 'body { color: red; }', 'style.css');
      expect(res).toBeNull();
    });

    it('should transform CSS imports with ?import suffix', async () => {
      const stylePath = path.resolve(process.cwd(), 'style.css');
      const res = await plugin.transform!.call(dummyContext, 'body { color: red; }', `${stylePath}?import`);
      expect(res).not.toBeNull();
      expect(res?.code).toContain("const css = 'body { color: red; }';");
      expect(res?.code).toContain("const id = '/style.css';");
    });
  });

  describe('hmrPlugin', () => {
    const plugin = hmrPlugin();

    it('should ignore non-js modules', async () => {
      const res = await plugin.transform!.call(dummyContext, 'body {}', 'style.css');
      expect(res).toBeNull();
    });

    it('should ignore node_modules scripts', async () => {
      const res = await plugin.transform!.call(dummyContext, 'console.log();', 'node_modules/react/index.js');
      expect(res).toBeNull();
    });

    it('should inject hot context blocks into project modules', async () => {
      const res = await plugin.transform!.call(dummyContext, 'export const val = 1;', 'src/main.jsx');
      expect(res).not.toBeNull();
      expect(res?.code).toContain('import.meta.hot = window.__ray_create_hot_context(import.meta.url);');
    });
  });
});
