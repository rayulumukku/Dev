import { describe, it, expect, beforeEach } from 'vitest';
import { generateScopedClassName } from '../../packages/plugin-css/src/modules/ClassNameGenerator.js';
import { generateJSExports } from '../../packages/plugin-css/src/modules/ExportGenerator.js';
import { compileCSSModule } from '../../packages/plugin-css/src/modules/ModuleCompiler.js';
import { CSSModulesCache, globalCSSModulesCache } from '../../packages/plugin-css/src/modules/Cache.js';
import cssPlugin from '../../packages/plugin-css/src/CSSPlugin.js';
import { PluginContainer } from '../../packages/core/src/plugins/index.js';
import { transformFile } from '../../packages/transform/src/index.js';

describe('CSS Modules Support in @ray/plugin-css (PR-13)', () => {
  beforeEach(() => {
    globalCSSModulesCache.clear();
  });

  const sampleModuleCSS = `
.container {
  padding: 16px;
}
.primaryButton {
  color: blue;
}
  `;

  it('should generate human-readable scoped class names in development mode', () => {
    const scopedName = generateScopedClassName('btn', 'Button.module.css', false);
    expect(scopedName).toContain('Button_btn__');
  });

  it('should generate short deterministic hash class names in production mode', () => {
    const prodName = generateScopedClassName('btn', 'Button.module.css', true);
    expect(prodName).toMatch(/^_[a-z0-9]+$/);
  });

  it('should compile CSS module into scoped CSS and ES module exports', () => {
    const result = compileCSSModule(sampleModuleCSS, 'Button.module.css', false);

    expect(result.css).toContain('.Button_container__');
    expect(result.css).toContain('.Button_primaryButton__');
    expect(result.mapping.container).toBeDefined();
    expect(result.mapping.primaryButton).toBeDefined();
    expect(result.jsCode).toContain('export const container =');
    expect(result.jsCode).toContain('export default styles;');
  });

  it('should generate valid ES module exports with default dictionary and named class exports', () => {
    const exports = generateJSExports({ btn: 'Button_btn__123' }, '.Button_btn__123 { color: red; }', 'Button.module.css');

    expect(exports).toContain('export const btn = "Button_btn__123";');
    expect(exports).toContain('export default styles;');
  });

  it('should maintain in-memory CSS Modules cache', () => {
    const cache = new CSSModulesCache();
    cache.set('Button.module.css', '.Button_btn__123 {}', { btn: 'Button_btn__123' });

    expect(cache.get('Button.module.css')?.mapping.btn).toBe('Button_btn__123');
  });

  it('should transform *.module.css files through Ray plugin transform pipeline', async () => {
    const plugin = cssPlugin();
    const container = new PluginContainer([plugin]);

    const res = await transformFile(sampleModuleCSS, 'Button.module.css', {
      pluginContainer: container,
    });

    expect(res.code).toContain('export const container =');
    expect(res.code).toContain('export default styles;');
    expect(res.code).toContain('import.meta.hot.accept');
  });

  it('should keep standard non-module .css files untouched by CSS Modules scoping', async () => {
    const plugin = cssPlugin();
    const container = new PluginContainer([plugin]);

    const res = await transformFile('.regular-class { color: red; }', 'style.css', {
      pluginContainer: container,
    });

    expect(res.code).not.toContain('styles =');
    expect(res.code).toContain('export default ".regular-class { color: red; }";');
  });
});
