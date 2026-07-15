import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { scanDeps, runOptimizer, OptimizerGraph } from '../../packages/core/src/optimizer/index.js';
import { Resolver } from '../../packages/core/src/resolver/index.js';
import { transformCjsToEsm } from '../../packages/core/src/compiler/index.js';

describe('Optimizer Unit Tests', () => {
  const projectRoot = path.resolve(process.cwd(), 'tests/fixtures/opt-project');
  const resolver = new Resolver(projectRoot);

  beforeAll(() => {
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });

    // 1. Create index.html with module script tag
    fs.writeFileSync(
      path.join(projectRoot, 'index.html'),
      `<!DOCTYPE html>
      <html>
        <body>
          <script type="module" src="/src/main.jsx"></script>
        </body>
      </html>`
    );

    // 2. Create src/main.jsx importing react
    fs.writeFileSync(
      path.join(projectRoot, 'src/main.jsx'),
      `import React from 'react';
      import './sub.js';
      console.log(React);`
    );

    // 3. Create src/sub.js
    fs.writeFileSync(
      path.join(projectRoot, 'src/sub.js'),
      `export const val = "sub";`
    );
  });

  afterAll(async () => {
    // Retry once on Windows EPERM (file handle still open after test completes)
    const cleanup = () => {
      try { fs.rmSync(projectRoot, { recursive: true, force: true }); } catch { /* ignore */ }
    };
    cleanup();
    await new Promise<void>((r) => setTimeout(r, 200));
    cleanup();
  });

  it('should scan dependencies from entry files', async () => {
    const deps = await scanDeps(projectRoot, resolver, [], []);
    expect(deps).toBeDefined();
    // Should scan 'react' bare import
    expect(deps.has('react')).toBe(true);
  });

  it('should optimize and cache dependencies on first run', async () => {
    const config = {
      optimizeDeps: {
        include: ['react']
      }
    };

    const res = await runOptimizer(projectRoot, config, resolver, { force: true });
    expect(res.coldStart).toBe(true);
    expect(res.cacheMisses).toBeGreaterThanOrEqual(1);

    const cacheDir = path.join(projectRoot, '.ray/cache');
    expect(fs.existsSync(cacheDir)).toBe(true);
    expect(fs.existsSync(path.join(cacheDir, 'metadata.json'))).toBe(true);
  });

  it('should result in cache hits on subsequent runs', async () => {
    const config = {
      optimizeDeps: {
        include: ['react']
      }
    };

    const res = await runOptimizer(projectRoot, config, resolver, { force: false });
    expect(res.coldStart).toBe(false);
    expect(res.cacheHits).toBeGreaterThanOrEqual(1);
  });

  it('should clear cache folder on clear option', async () => {
    const res = await runOptimizer(projectRoot, {}, resolver, { clear: true });
    expect(res.optimized).toEqual({});
    const cacheDir = path.join(projectRoot, '.ray/cache');
    expect(fs.existsSync(cacheDir)).toBe(false);
  });

  it('should correctly convert CommonJS requires and module.exports to ESM formats', () => {
    const cjs = 'const react = require("react"); module.exports = react;';
    const esm = transformCjsToEsm(cjs);
    expect(esm).toContain('import react from "react"');
    expect(esm).toContain('export default react');
  });

  it('should manage OptimizerGraph status and track nodes correctly', () => {
    const graph = new OptimizerGraph();
    expect(graph.getStatus('react')).toBe('dirty');
    
    graph.register('react', 'hash-123', []);
    expect(graph.getStatus('react')).toBe('clean');

    graph.markDirty('react');
    expect(graph.getStatus('react')).toBe('dirty');
  });
});
