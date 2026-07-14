import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { RayCore } from '../../packages/core/src/index.js';
import { buildProject } from '../../packages/core/src/build/index.js';

describe('SSR & SSG and Library Mode Integration Tests', () => {
  const projectRoot = path.resolve(process.cwd(), 'tests/fixtures/ssr-project');

  beforeAll(() => {
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });

    // 1. Create index.html
    fs.writeFileSync(
      path.join(projectRoot, 'index.html'),
      `<!DOCTYPE html>
      <html>
        <head><title>Test App</title></head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.jsx"></script>
        </body>
      </html>`
    );

    // 2. Create ray.config.ts
    fs.writeFileSync(
      path.join(projectRoot, 'ray.config.ts'),
      `import { defineConfig } from '@ray/core';
      export default defineConfig({
        mode: 'production'
      });`
    );

    // 3. Create src/main.jsx
    fs.writeFileSync(
      path.join(projectRoot, 'src/main.jsx'),
      `import React from 'react';
      export const App = () => <div>Hello SSR</div>;`
    );

    // 4. Create src/entry-client.jsx
    fs.writeFileSync(
      path.join(projectRoot, 'src/entry-client.jsx'),
      `import React from 'react';
      import { App } from './main.jsx';
      // client hydrate logic
      `
    );

    // 5. Create src/entry-server.jsx
    fs.writeFileSync(
      path.join(projectRoot, 'src/entry-server.jsx'),
      `import React from 'react';
      export async function render(url) {
        return {
          html: "<div>Hello SSR HTML from Server</div>"
        };
      }`
    );
  });

  afterAll(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('should run ssrLoadModule successfully', async () => {
    const core = new RayCore(projectRoot);
    await core.init();
    const result = await core.ssrLoadModule(path.join(projectRoot, 'src/entry-server.jsx'));
    expect(result).toBeDefined();
    expect(result.render).toBeTypeOf('function');
    const renderRes = await result.render('/');
    expect(renderRes.html).toBe('<div>Hello SSR HTML from Server</div>');
  });

  it('should build project in SSG mode', async () => {
    const originalDir = process.cwd();
    process.chdir(projectRoot);

    try {
      await buildProject({
        outDir: 'dist',
        minify: true,
        sourcemap: false,
        watch: false,
        analyze: false,
        ssg: true,
      });

      const distDir = path.join(projectRoot, 'dist');
      expect(fs.existsSync(distDir)).toBe(true);

      // Check client outputs
      const clientHtml = fs.readFileSync(path.join(distDir, 'client/index.html'), 'utf-8');
      expect(clientHtml).toContain('<div>Hello SSR HTML from Server</div>');
      expect(clientHtml).toContain('window.__RAY_DATA__');

      // Check build-report
      const buildReport = JSON.parse(fs.readFileSync(path.join(distDir, 'client/build-report.json'), 'utf-8'));
      expect(buildReport.buildDurationMs).toBeGreaterThan(0);
    } finally {
      process.chdir(originalDir);
    }
  });

  it('should build in Library Mode', async () => {
    const libRoot = path.resolve(process.cwd(), 'tests/fixtures/lib-project');
    fs.mkdirSync(libRoot, { recursive: true });
    fs.mkdirSync(path.join(libRoot, 'src'), { recursive: true });
    fs.writeFileSync(path.join(libRoot, 'src/index.ts'), 'export const getVersion = () => "1.0.0";');
    fs.writeFileSync(
      path.join(libRoot, 'package.json'),
      JSON.stringify({ name: 'mock-library', version: '1.0.0', type: 'module' }, null, 2)
    );

    const originalDir = process.cwd();
    process.chdir(libRoot);

    try {
      await buildProject({
        outDir: 'dist',
        minify: true,
        sourcemap: false,
        watch: false,
        analyze: false,
        lib: true,
        entry: 'src/index.ts',
        name: 'MockLib',
        formats: 'esm,cjs,umd',
      });

      const distDir = path.join(libRoot, 'dist');
      expect(fs.existsSync(path.join(distDir, 'index.esm.js'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.cjs.js'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'index.umd.js'))).toBe(true);
      expect(fs.existsSync(path.join(distDir, 'package.json'))).toBe(true);

      const report = JSON.parse(fs.readFileSync(path.join(distDir, 'library-report.json'), 'utf-8'));
      expect(report.formats).toContain('esm');
      expect(report.formats).toContain('cjs');
      expect(report.formats).toContain('umd');
    } finally {
      process.chdir(originalDir);
      fs.rmSync(libRoot, { recursive: true, force: true });
    }
  });
});
