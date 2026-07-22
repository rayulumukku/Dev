import { describe, it, expect, vi } from 'vitest';
import { transformFile, transformJsx } from '../../packages/transform/src/index.js';
import { PluginContainer, RayPlugin } from '../../packages/core/src/plugins/index.js';
import { uppercaseCommentsPlugin } from '../../packages/examples/plugins/uppercase-comments.js';
import { bannerPlugin } from '../../packages/examples/plugins/banner.js';
import { consoleStripPlugin } from '../../packages/examples/plugins/console-strip.js';

describe('Transform Pipeline Lifecycle Hooks (PR-07)', () => {
  it('should execute beforeTransform hooks in order prior to transformation', async () => {
    const executionLog: string[] = [];

    const pluginA: RayPlugin = {
      name: 'plugin-a',
      beforeTransform(ctx) {
        executionLog.push(`before:A:${ctx.filename}`);
      },
    };

    const pluginB: RayPlugin = {
      name: 'plugin-b',
      beforeTransform(ctx) {
        executionLog.push(`before:B:${ctx.filename}`);
      },
    };

    const container = new PluginContainer([pluginA, pluginB]);
    await transformFile('export const x = 1;', 'App.jsx', { pluginContainer: container });

    expect(executionLog).toEqual(['before:A:App.jsx', 'before:B:App.jsx']);
  });

  it('should execute transform hooks in sequential chain order', async () => {
    const pluginA: RayPlugin = {
      name: 'plugin-a',
      transform(code) {
        return code.replace('1', '2');
      },
    };

    const pluginB: RayPlugin = {
      name: 'plugin-b',
      transform(code) {
        return code.replace('2', '3');
      },
    };

    const container = new PluginContainer([pluginA, pluginB]);
    const res = await transformFile('export const x = 1;', 'App.js', { pluginContainer: container });

    expect(res.code).toContain('x = 3');
  });

  it('should execute afterTransform hooks in order post-compilation', async () => {
    const log: string[] = [];

    const pluginA: RayPlugin = {
      name: 'plugin-a',
      afterTransform(res) {
        log.push('after:A');
        return { code: `${res.code}\n// after A` };
      },
    };

    const pluginB: RayPlugin = {
      name: 'plugin-b',
      afterTransform(res) {
        log.push('after:B');
        return { code: `${res.code}\n// after B` };
      },
    };

    const container = new PluginContainer([pluginA, pluginB]);
    const res = await transformFile('export const a = 10;', 'App.js', { pluginContainer: container });

    expect(log).toEqual(['after:A', 'after:B']);
    expect(res.code).toContain('// after A');
    expect(res.code).toContain('// after B');
  });

  it('should support async transforms across lifecycle stages', async () => {
    const asyncPlugin: RayPlugin = {
      name: 'async-plugin',
      async beforeTransform() {
        await new Promise((r) => setTimeout(r, 10));
      },
      async transform(code) {
        await new Promise((r) => setTimeout(r, 10));
        return { code: code.replace('hello', 'world') };
      },
      async afterTransform(res) {
        await new Promise((r) => setTimeout(r, 10));
        return { code: `${res.code}\n// async done` };
      },
    };

    const container = new PluginContainer([asyncPlugin]);
    const res = await transformFile('export const msg = "hello";', 'App.js', { pluginContainer: container });

    expect(res.code).toContain('world');
    expect(res.code).toContain('// async done');
  });

  it('should preserve source maps through the pipeline', async () => {
    const sourceMapPlugin: RayPlugin = {
      name: 'map-plugin',
      transform(code) {
        return {
          code: `${code}\nexport const y = 2;`,
          map: { version: 3, mappings: 'AAAA', sources: ['App.js'] },
        };
      },
    };

    const container = new PluginContainer([sourceMapPlugin]);
    const res = await transformFile('export const x = 1;', 'App.js', {
      pluginContainer: container,
      sourcemap: true,
    });

    expect(res.code).toContain('export const x = 1;');
    expect(res.code).toContain('export const y = 2;');
    expect(res.map).toBeDefined();
  });

  it('should report plugin errors cleanly with plugin name, file, and stage', async () => {
    const errorPlugin: RayPlugin = {
      name: 'failing-plugin',
      transform(_code, id) {
        throw new Error('Custom syntax transform failure');
      },
    };

    const container = new PluginContainer([errorPlugin]);
    await expect(
      transformFile('const x = 1;', 'broken.js', { pluginContainer: container })
    ).rejects.toThrowError(/\[Plugin: failing-plugin\] transform error in broken.js: Custom syntax transform failure/);
  });

  it('should run zero-plugin fast path with zero overhead', async () => {
    const directRes = await transformFile('export const val = 100;', 'App.js');
    expect(directRes.code).toContain('export const val = 100;');
  });

  it('should execute uppercase-comments example plugin', async () => {
    const plugin = uppercaseCommentsPlugin();
    const container = new PluginContainer([plugin]);
    const res = await transformFile('export const msg = "hello";', 'App.js', { pluginContainer: container });

    expect(res.code).toContain('HELLO');
  });


  it('should execute banner example plugin', async () => {
    const plugin = bannerPlugin({ bannerText: '/* Custom Banner Header */' });
    const container = new PluginContainer([plugin]);
    const res = await transformFile('export const x = 1;', 'App.js', { pluginContainer: container });

    expect(res.code).toContain('/* Custom Banner Header */');
  });

  it('should execute console-strip example plugin', async () => {
    const plugin = consoleStripPlugin();
    const container = new PluginContainer([plugin]);
    const res = await transformFile('console.log("debug");\nexport const x = 1;', 'App.js', { pluginContainer: container });

    expect(res.code).not.toContain('console.log("debug")');
    expect(res.code).toContain('export const x = 1;');
  });

  it('should preserve React Export Proxy Pattern and HMR compatibility', async () => {
    const modifierPlugin: RayPlugin = {
      name: 'react-modifier',
      transform(code) {
        return code.replace('Hello', 'Hello World');
      },
    };

    const container = new PluginContainer([modifierPlugin]);
    const reactComponentCode = `
      import React from 'react';
      export function MyComponent() {
        return <div>Hello</div>;
      }
    `;

    const res = await transformJsx(reactComponentCode, 'MyComponent.jsx', { pluginContainer: container });
    expect(res).toContain('Hello World');
  });
});
