import { describe, it, expect, beforeEach } from 'vitest';
import { detectTailwind } from '../../packages/plugin-css/src/tailwind/TailwindDetector.js';
import { extractClassNames } from '../../packages/plugin-css/src/tailwind/ContentScanner.js';
import { processTailwind } from '../../packages/plugin-css/src/tailwind/TailwindPipeline.js';
import { TailwindCache, globalTailwindCache } from '../../packages/plugin-css/src/tailwind/Cache.js';
import cssPlugin from '../../packages/plugin-css/src/CSSPlugin.js';
import { PluginContainer } from '../../packages/core/src/plugins/index.js';
import { transformFile } from '../../packages/transform/src/index.js';
import path from 'path';

describe('Tailwind CSS Integration in @ray/plugin-css (PR-12)', () => {
  beforeEach(() => {
    globalTailwindCache.clear();
  });

  it('should detect Tailwind v3 when tailwind.config.js is present', () => {
    const fixtureDir = path.resolve(process.cwd(), 'examples/react-tailwind');
    const info = detectTailwind(fixtureDir, '');

    expect(info.hasConfig).toBe(true);
    expect(info.version).toBe('v3');
    expect(info.configPath).toContain('tailwind.config.js');
  });

  it('should detect Tailwind v4 via CSS @import "tailwindcss" directive', () => {
    const info = detectTailwind('C:/tmp/no-config', '@import "tailwindcss";');

    expect(info.hasConfig).toBe(true);
    expect(info.version).toBe('v4');
  });

  it('should scan JSX and Vue content for utility class names', () => {
    const jsxCode = '<div className="flex items-center p-4 text-white">Hello</div>';
    const classes = extractClassNames(jsxCode);

    expect(classes.has('flex')).toBe(true);
    expect(classes.has('items-center')).toBe(true);
    expect(classes.has('p-4')).toBe(true);
    expect(classes.has('text-white')).toBe(true);
  });

  it('should process Tailwind directives into utility CSS rules', () => {
    const cssInput = '@tailwind base;\n@tailwind components;\n@tailwind utilities;';
    const result = processTailwind(cssInput, 'index.css', 'C:/tmp/no-config');

    expect(result.hasTailwind).toBe(true);
    expect(result.code).toContain('.flex');
    expect(result.code).toContain('.items-center');
    expect(result.code).toContain('.p-4');
  });

  it('should maintain generated utility CSS cache', () => {
    const cache = new TailwindCache();
    cache.set('hash-1', '.flex { display: flex; }', 'hash-1');

    expect(cache.get('hash-1')?.css).toBe('.flex { display: flex; }');
  });

  it('should execute zero-overhead fast-path when no Tailwind is detected', () => {
    const result = processTailwind('.custom-class { color: red; }', 'custom.css', 'C:/tmp/no-config');

    expect(result.hasTailwind).toBe(false);
    expect(result.code).toBe('.custom-class { color: red; }');
  });

  it('should transform Tailwind CSS through Ray plugin transform pipeline', async () => {
    const plugin = cssPlugin();
    const container = new PluginContainer([plugin]);

    const res = await transformFile('@tailwind utilities;', 'index.css', {
      pluginContainer: container,
    });

    expect(res.code).toContain('.flex');
    expect(res.code).toContain('import.meta.hot.accept');
  });
});
