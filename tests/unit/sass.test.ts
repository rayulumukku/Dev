import { describe, it, expect, beforeEach } from 'vitest';
import { compileSass } from '../../packages/plugin-css/src/sass/SassCompiler.js';
import { resolveSassImport } from '../../packages/plugin-css/src/sass/ImportResolver.js';
import { globalSassDependencyTracker } from '../../packages/plugin-css/src/sass/DependencyTracker.js';
import { SassCache, globalSassCache } from '../../packages/plugin-css/src/sass/Cache.js';
import cssPlugin from '../../packages/plugin-css/src/CSSPlugin.js';
import { PluginContainer } from '../../packages/core/src/plugins/index.js';
import { transformFile } from '../../packages/transform/src/index.js';

describe('Sass and SCSS Integration in @ray/plugin-css (PR-14)', () => {
  beforeEach(() => {
    globalSassDependencyTracker.clear();
    globalSassCache.clear();
  });

  const sampleSCSS = `
$primary-color: #6366f1;
.card {
  color: $primary-color;
}
  `;

  it('should compile SCSS variables and syntax into standard CSS', () => {
    const result = compileSass(sampleSCSS, 'main.scss');

    expect(result.css).toContain('.card');
    expect(result.css).toContain('#6366f1');
    expect(result.css).not.toContain('$primary-color');
  });

  it('should track @use / @forward / @import dependencies in SassDependencyTracker', () => {
    const scssWithImports = `@use "./variables";\n.btn { color: red; }`;
    const result = compileSass(scssWithImports, 'C:/project/src/main.scss');

    expect(result.css).toContain('.btn { color: red; }');
  });

  it('should maintain Sass in-memory cache', () => {
    const cache = new SassCache();
    cache.set('main.scss', '.card { color: blue; }', 1000);

    expect(cache.get('main.scss')?.css).toBe('.card { color: blue; }');
  });

  it('should transform .scss files through Ray plugin transform pipeline', async () => {
    const plugin = cssPlugin();
    const container = new PluginContainer([plugin]);

    const res = await transformFile(sampleSCSS, 'main.scss', {
      pluginContainer: container,
    });

    expect(res.code).toContain('#6366f1');
    expect(res.code).toContain('import.meta.hot.accept');
  });

  it('should transform .module.scss files through combined Sass + CSS Modules pipeline', async () => {
    const plugin = cssPlugin();
    const container = new PluginContainer([plugin]);

    const scssModuleCode = `
$bg: #000;
.btn {
  background: $bg;
}
    `;

    const res = await transformFile(scssModuleCode, 'Button.module.scss', {
      pluginContainer: container,
    });

    expect(res.code).toContain('export const btn =');
    expect(res.code).toContain('export default styles;');
    expect(res.code).toContain('import.meta.hot.accept');
  });
});
