import { describe, it, expect, beforeEach } from 'vitest';
import { DescriptorCache, globalDescriptorCache } from '../../packages/plugin-vue/src/hmr/descriptorCache.js';
import { preserveVueState } from '../../packages/plugin-vue/src/hmr/statePreserver.js';
import { createHMRBoundary } from '../../packages/plugin-vue/src/hmr/boundary.js';
import { handleVueUpdate } from '../../packages/plugin-vue/src/hmr/updateHandler.js';
import { generateVueHMRAccept } from '../../packages/plugin-vue/src/hmr/accept.js';
import { parseSFC } from '../../packages/plugin-vue/src/SFCParser.js';
import vuePlugin from '../../packages/plugin-vue/src/VuePlugin.js';
import { PluginContainer } from '../../packages/core/src/plugins/index.js';
import { transformFile } from '../../packages/transform/src/index.js';

describe('State-Preserving Vue HMR (PR-09)', () => {
  beforeEach(() => {
    globalDescriptorCache.clear();
  });

  const baseSFC = `
<template>
  <div>Count: {{ count }}</div>
</template>
<script>
export default {
  data() { return { count: 0 }; }
};
</script>
<style>
.counter { color: blue; }
</style>
  `;

  it('should maintain descriptor cache and classify template-only updates', () => {
    const cache = new DescriptorCache();
    const sfc1 = parseSFC(baseSFC, 'App.vue');
    const { type: type1 } = cache.set('App.vue', sfc1);
    expect(type1).toBe('multiple');

    const templateEditSFC = baseSFC.replace('Count:', 'Current Count:');
    const sfc2 = parseSFC(templateEditSFC, 'App.vue');
    const { type: type2 } = cache.set('App.vue', sfc2);
    expect(type2).toBe('template-only');
  });

  it('should classify style-only updates', () => {
    const cache = new DescriptorCache();
    const sfc1 = parseSFC(baseSFC, 'App.vue');
    cache.set('App.vue', sfc1);

    const styleEditSFC = baseSFC.replace('color: blue;', 'color: red;');
    const sfc2 = parseSFC(styleEditSFC, 'App.vue');
    const { type } = cache.set('App.vue', sfc2);
    expect(type).toBe('style-only');
  });

  it('should classify script-only updates', () => {
    const cache = new DescriptorCache();
    const sfc1 = parseSFC(baseSFC, 'App.vue');
    cache.set('App.vue', sfc1);

    const scriptEditSFC = baseSFC.replace('count: 0', 'count: 10');
    const sfc2 = parseSFC(scriptEditSFC, 'App.vue');
    const { type } = cache.set('App.vue', sfc2);
    expect(type).toBe('script-only');
  });

  it('should route update types in handleVueUpdate', () => {
    expect(handleVueUpdate({ file: 'App.vue', type: 'style-only', timestamp: 1 })).toEqual({
      action: 'reload-styles',
      file: 'App.vue',
    });

    expect(handleVueUpdate({ file: 'App.vue', type: 'template-only', timestamp: 1 })).toEqual({
      action: 'rerender',
      file: 'App.vue',
    });

    expect(handleVueUpdate({ file: 'App.vue', type: 'script-only', timestamp: 1 })).toEqual({
      action: 'reload-module',
      file: 'App.vue',
    });
  });

  it('should preserve component state during template re-rendering', () => {
    let reRendered = false;
    const instance = {
      template: 'old',
      $forceUpdate() {
        reRendered = true;
      },
    };

    const newModule = {
      default: {
        template: 'new template',
      },
    };

    preserveVueState(instance, newModule);

    expect(instance.template).toBe('new template');
    expect(reRendered).toBe(true);
  });

  it('should generate HMR accept boundary code', () => {
    const code = generateVueHMRAccept('App.vue', 'template-only');
    expect(code).toContain('import.meta.hot.accept');
    expect(code).toContain('template-only');
    expect(code).toContain('App.vue');
  });

  it('should create HMR boundary metadata', () => {
    const boundary = createHMRBoundary('Child.vue', ['Parent.vue']);
    expect(boundary.file).toBe('Child.vue');
    expect(boundary.isSelfAccepting).toBe(true);
    expect(boundary.parents).toContain('Parent.vue');
  });

  it('should transform .vue files with HMR metadata attached', async () => {
    const plugin = vuePlugin();
    const container = new PluginContainer([plugin]);

    const res = await transformFile(baseSFC, 'App.vue', { pluginContainer: container });

    expect(res.code).toContain('import.meta.hot.accept');
  });

  it('should handle full reload fallback gracefully', () => {
    const fallbackUpdate = handleVueUpdate({ file: 'App.vue', type: 'multiple', timestamp: 1 });
    expect(fallbackUpdate.action).toBe('reload-module');
  });
});
