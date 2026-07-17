import { describe, it, expect } from 'vitest';
import { vue } from '../../packages/core/src/index.js';
import { solid } from '../../packages/core/src/index.js';
import { svelte } from '../../packages/core/src/index.js';
import { tailwind } from '../../packages/core/src/index.js';
import { eslint } from '../../packages/core/src/index.js';
import { pwa } from '../../packages/core/src/index.js';
import { image } from '../../packages/core/src/index.js';

describe('New Official Plugins Unit Tests', () => {
  const dummyContext = {
    projectRoot: process.cwd(),
    logger: {
      warn: (msg: string) => {
        dummyContext.warnings.push(msg);
      }
    },
    warnings: [] as string[]
  } as any;

  it('should compile Vue SFC components', async () => {
    const code = `
<template><div>Hello Vue</div></template>
<script>export default { name: 'App' }</script>
<style>.vue-class { color: green; }</style>
`;
    const plugin = vue();
    const res = await plugin.transform!.call(dummyContext, code, 'src/App.vue');
    expect(res).not.toBeNull();
    expect(res?.code).toContain("const _sfc_main = { name: 'App' }");
    expect(res?.code).toContain("_sfc_main.template = \"<div>Hello Vue</div>\"");
    expect(res?.code).toContain(".vue-class { color: green; }");
  });

  it('should transform SolidJS reactive modules', async () => {
    const code = "import { createSignal } from 'solid-js';";
    const plugin = solid();
    const res = await plugin.transform!.call(dummyContext, code, 'src/App.jsx');
    expect(res).not.toBeNull();
    expect(res?.code).toContain("solid-js");
  });

  it('should compile Svelte components', async () => {
    const code = `
<script>let name = 'world';</script>
<main><h1>Hello {name}</h1></main>
<style>h1 { color: red; }</style>
`;
    const plugin = svelte();
    const res = await plugin.transform!.call(dummyContext, code, 'src/App.svelte');
    expect(res).not.toBeNull();
    expect(res?.code).toContain("let name = 'world';");
    expect(res?.code).toContain("class Component");
    expect(res?.code).toContain("h1 { color: red; }");
  });

  it('should preprocess Tailwind CSS directives', async () => {
    const code = "@tailwind base;\n@tailwind components;\n@tailwind utilities;";
    const plugin = tailwind();
    const res = await plugin.transform!.call(dummyContext, code, 'src/global.css');
    expect(res).not.toBeNull();
    expect(res?.code).toContain("/* Tailwind Base Styles */");
    expect(res?.code).toContain("/* Tailwind Utilities */");
  });

  it('should log warning for debugger in eslint plugin', async () => {
    dummyContext.warnings = [];
    const code = "const x = 5; debugger;";
    const plugin = eslint();
    const res = await plugin.transform!.call(dummyContext, code, 'src/App.js');
    expect(res).toBeNull();
    expect(dummyContext.warnings[0]).toContain("Avoid 'debugger' statement");
  });

  it('should inject ServiceWorker script in pwa plugin', async () => {
    const code = "<html><body><h1>Hello PWA</h1></body></html>";
    const plugin = pwa();
    const res = await plugin.transform!.call(dummyContext, code, 'index.html');
    expect(res).not.toBeNull();
    expect(res?.code).toContain("navigator.serviceWorker.register('/sw.js')");
  });

  it('should export image metadata in image plugin', async () => {
    const plugin = image();
    const logoPath = require('path').resolve(process.cwd(), 'src/logo.png');
    const res = await plugin.transform!.call(dummyContext, '', logoPath);
    expect(res).not.toBeNull();
    expect(res?.code).toContain('"src":"/src/logo.png"');
    expect(res?.code).toContain('"format":"png"');
  });
});
