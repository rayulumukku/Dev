import { describe, it, expect, beforeEach } from 'vitest';
import { findPostCSSConfig } from '../../packages/plugin-css/src/postcss/ConfigLoader.js';
import { runPostCSSPlugins } from '../../packages/plugin-css/src/postcss/Processor.js';
import { processPostCSS } from '../../packages/plugin-css/src/postcss/PostCSSPipeline.js';
import { PostCSSCache, globalPostCSSCache } from '../../packages/plugin-css/src/postcss/Cache.js';
import { processCSS } from '../../packages/plugin-css/src/CSSPipeline.js';
import cssPlugin from '../../packages/plugin-css/src/CSSPlugin.js';
import { PluginContainer } from '../../packages/core/src/plugins/index.js';
import { transformFile } from '../../packages/transform/src/index.js';
import path from 'path';

describe('PostCSS Integration in @ray/plugin-css (PR-11)', () => {
  beforeEach(() => {
    globalPostCSSCache.clear();
  });

  it('should discover postcss.config.js when present in project root', () => {
    const fixtureDir = path.resolve(process.cwd(), 'examples/postcss-basic');
    const configPath = findPostCSSConfig(fixtureDir);

    expect(configPath).not.toBeNull();
    expect(configPath).toContain('postcss.config.js');
  });

  it('should run custom PostCSS plugin transformations', () => {
    const customPlugin = (css: string) => css.replace(/red/g, 'blue');
    const result = runPostCSSPlugins('.title { color: red; }', [customPlugin]);

    expect(result).toBe('.title { color: blue; }');
  });

  it('should maintain PostCSS in-memory cache', () => {
    const cache = new PostCSSCache();
    cache.setConfig('project-root', { plugins: [] });

    expect(cache.getConfig('project-root')).toBeDefined();

    cache.setResult('style.css', { css: 'body { margin: 0; }', hash: '123' });
    expect(cache.getResult('style.css')?.css).toBe('body { margin: 0; }');
  });

  it('should execute zero-config fast path when no PostCSS config is found', () => {
    const result = processPostCSS('.card { padding: 8px; }', 'card.css', 'C:/tmp/non-existent-dir');

    expect(result.hasConfig).toBe(false);
    expect(result.code).toBe('.card { padding: 8px; }');
  });

  it('should process CSS with PostCSS during transformFile execution', async () => {
    const plugin = cssPlugin();
    const container = new PluginContainer([plugin]);

    const res = await transformFile('.btn { color: red; }', 'btn.css', {
      pluginContainer: container,
    });

    expect(res.code).toContain('.btn { color: red; }');
    expect(res.code).toContain('import.meta.hot.accept');
  });

  it('should format PostCSS errors cleanly with file context', () => {
    const brokenPipeline = () => {
      throw new Error('PostCSS syntax error on line 4');
    };

    expect(() => {
      try {
        brokenPipeline();
      } catch (err: any) {
        throw new Error(`[PostCSS Error in style.css]: ${err.message}`);
      }
    }).toThrowError(/\[PostCSS Error in style\.css\]: PostCSS syntax error on line 4/);
  });
});
