import { describe, it, expect } from 'vitest';
import { SSRRuntime } from '../../packages/ssr/src/SSRRuntime.js';
import { renderFullHTML } from '../../packages/ssr/src/HTMLRenderer.js';
import { generateHydrationScript } from '../../packages/ssr/src/Hydration.js';
import { ssrLoadModule } from '../../packages/ssr/src/ModuleLoader.js';

describe('Foundational SSR Architecture (PR-28)', () => {
  it('should initialize SSRRuntime with default and custom configurations', () => {
    const runtime = new SSRRuntime({ enabled: true, entry: './src/entry-server.ts' });
    expect(runtime.isSSREnabled()).toBe(true);
    expect(runtime.getRenderer()).toBeDefined();
  });

  it('should generate client hydration script tags correctly', () => {
    const script = generateHydrationScript({ user: 'Alice', role: 'admin' });
    expect(script).toContain('window.__INITIAL_DATA__ =');
    expect(script).toContain('"user":"Alice"');
  });

  it('should combine template, head elements, app string, and hydration script into full HTML', () => {
    const template = '<!DOCTYPE html><html><head></head><body><!--app-html--></body></html>';
    const result = {
      html: '<h1>Hello SSR</h1>',
      head: ['<title>SSR Page</title>'],
      initialData: { id: 123 },
    };

    const fullHTML = renderFullHTML(template, result);
    expect(fullHTML).toContain('<title>SSR Page</title>');
    expect(fullHTML).toContain('window.__INITIAL_DATA__ = {"id":123}');
    expect(fullHTML).toContain('<h1>Hello SSR</h1>');
  });

  it('should dynamically evaluate server module code via ssrLoadModule VM runner', async () => {
    const code = 'exports.render = function(url) { return { html: "<div>" + url + "</div>" }; };';
    const mod = await ssrLoadModule(code, 'entry-server.js');

    expect(typeof mod.render).toBe('function');
    const res = mod.render('/about');
    expect(res.html).toBe('<div>/about</div>');
  });
});
