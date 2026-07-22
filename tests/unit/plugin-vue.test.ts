import { describe, it, expect } from 'vitest';
import { parseSFC } from '../../packages/plugin-vue/src/SFCParser.js';
import { compileSFC } from '../../packages/plugin-vue/src/SFCCompiler.js';
import { resolveVueId } from '../../packages/plugin-vue/src/VueResolver.js';
import { generateVueHMR } from '../../packages/plugin-vue/src/HMR.js';
import vuePlugin from '../../packages/plugin-vue/src/VuePlugin.js';
import { PluginContainer } from '../../packages/core/src/plugins/index.js';
import { transformFile } from '../../packages/transform/src/index.js';

describe('Official Vue 3 Plugin (@ray/plugin-vue) (PR-08)', () => {
  const sampleVueSFC = `
<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
  </div>
</template>

<script>
export default {
  data() {
    return {
      msg: 'Hello Vue 3'
    };
  }
};
</script>

<style>
.hello {
  color: red;
}
</style>
  `;

  it('should parse .vue Single File Components into structured descriptor', () => {
    const descriptor = parseSFC(sampleVueSFC, 'App.vue');

    expect(descriptor.filename).toBe('App.vue');
    expect(descriptor.script).toBeDefined();
    expect(descriptor.script?.content).toContain('Hello Vue 3');
    expect(descriptor.template).toBeDefined();
    expect(descriptor.template?.content).toContain('<h1>{{ msg }}</h1>');
    expect(descriptor.styles).toHaveLength(1);
    expect(descriptor.styles[0].content).toContain('color: red;');
  });

  it('should compile script block to _sfc_main assignment', () => {
    const descriptor = parseSFC(sampleVueSFC, 'App.vue');
    const compiled = compileSFC(descriptor);

    expect(compiled.code).toContain('const _sfc_main =');
    expect(compiled.code).toContain('export default _sfc_main;');
  });

  it('should compile template block onto _sfc_main.template', () => {
    const descriptor = parseSFC(sampleVueSFC, 'App.vue');
    const compiled = compileSFC(descriptor);

    expect(compiled.code).toContain('_sfc_main.template = "<div class=\\"hello\\">\\n    <h1>{{ msg }}</h1>\\n  </div>";');
  });

  it('should extract and inject styles into document head snippet', () => {
    const descriptor = parseSFC(sampleVueSFC, 'App.vue');
    const compiled = compileSFC(descriptor);

    expect(compiled.code).toContain('document.createElement(\'style\')');
    expect(compiled.code).toContain('color: red;');
  });

  it('should discover dependency imports inside script section', () => {
    const sfcWithImports = `
<template>
  <div><Child /></div>
</template>

<script setup>
import Child from './Child.vue';
import { ref } from 'vue';
</script>
    `;

    const descriptor = parseSFC(sfcWithImports, 'Parent.vue');
    expect(descriptor.script?.content).toContain("import Child from './Child.vue';");
    expect(descriptor.script?.content).toContain("import { ref } from 'vue';");
  });

  it('should resolve .vue specifier in VueResolver', () => {
    expect(resolveVueId('./App.vue')).toBe('./App.vue');
    expect(resolveVueId('./main.js')).toBeNull();
  });

  it('should generate HMR update snippet for .vue files', () => {
    const hmr = generateVueHMR('App.vue');
    expect(hmr).toContain('import.meta.hot.accept');
    expect(hmr).toContain('App.vue');
  });

  it('should register vuePlugin cleanly with PluginContainer', () => {
    const plugin = vuePlugin();
    const container = new PluginContainer([plugin]);

    expect(container.getPlugins()).toHaveLength(1);
    expect(container.getPlugins()[0].name).toBe('@ray/plugin-vue');
  });

  it('should transform .vue files through Ray transform pipeline', async () => {
    const plugin = vuePlugin();
    const container = new PluginContainer([plugin]);

    const res = await transformFile(sampleVueSFC, 'App.vue', { pluginContainer: container });

    expect(res.code).toContain('_sfc_main');
    expect(res.code).toContain('export default');
    expect(res.code).toContain('import.meta.hot');
  });

  it('should support dev server rendering and production build transforms', async () => {
    const plugin = vuePlugin({ isProduction: true });
    const container = new PluginContainer([plugin]);

    const res = await transformFile(sampleVueSFC, 'App.vue', {
      pluginContainer: container,
      mode: 'production',
    });

    expect(res.code).toBeDefined();
    expect(res.code.length).toBeGreaterThan(0);
  });
});
