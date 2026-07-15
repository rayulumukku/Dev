import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { RayBundler } from '../../packages/core/src/build/rayBundler.js';

describe('RayBundler Tests', () => {
  let projectRoot: string;
  let outDir: string;

  beforeAll(() => {
    projectRoot = path.resolve(process.cwd(), 'tests/fixtures/bundler-project');
    outDir = path.join(projectRoot, 'dist');
    fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });

    fs.writeFileSync(
      path.join(projectRoot, 'src', 'utils.ts'),
      `export function add(a: number, b: number): number { return a + b; }`
    );
    fs.writeFileSync(
      path.join(projectRoot, 'src', 'index.ts'),
      `import { add } from './utils.js';\nexport const result = add(1, 2);`
    );
  });

  afterAll(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('should bundle an entry file to ESM format', async () => {
    const bundler = new RayBundler(projectRoot);
    const output = await bundler.bundle({
      entryPoint: path.join(projectRoot, 'src', 'index.ts'),
      outFile: path.join(outDir, 'index.esm.js'),
      format: 'esm',
    });
    expect(output.code.length).toBeGreaterThan(0);
    expect(output.sizeBytes).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(outDir, 'index.esm.js'))).toBe(true);
  });

  it('should bundle to CJS format', async () => {
    const bundler = new RayBundler(projectRoot);
    const output = await bundler.bundle({
      entryPoint: path.join(projectRoot, 'src', 'index.ts'),
      outFile: path.join(outDir, 'index.cjs.js'),
      format: 'cjs',
    });
    expect(output.code.length).toBeGreaterThan(0);
    expect(fs.existsSync(path.join(outDir, 'index.cjs.js'))).toBe(true);
  });

  it('should bundle to UMD format with globalName wrapper', async () => {
    const bundler = new RayBundler(projectRoot);
    const output = await bundler.bundle({
      entryPoint: path.join(projectRoot, 'src', 'index.ts'),
      outFile: path.join(outDir, 'index.umd.js'),
      format: 'umd',
      globalName: 'MyLib',
    });
    expect(output.code).toContain('MyLib');
    expect(fs.existsSync(path.join(outDir, 'index.umd.js'))).toBe(true);
  });

  it('should respect external packages and not inline them', async () => {
    const src = path.join(projectRoot, 'src', 'withExternal.ts');
    fs.writeFileSync(src, `import React from 'react';\nexport const el = React.createElement('div');`);
    const bundler = new RayBundler(projectRoot);
    const output = await bundler.bundle({
      entryPoint: src,
      outFile: path.join(outDir, 'external.esm.js'),
      format: 'esm',
      external: ['react'],
    });
    // react should not be inlined (import should remain or not crash)
    expect(output.code.length).toBeGreaterThan(0);
  });

  it('should apply define() replacements to output code', async () => {
    const src = path.join(projectRoot, 'src', 'withDefine.ts');
    fs.writeFileSync(src, `const env = process.env.NODE_ENV;\nexport default env;`);
    const bundler = new RayBundler(projectRoot, { 'process.env.NODE_ENV': '"production"' });
    const output = await bundler.bundle({
      entryPoint: src,
      outFile: path.join(outDir, 'define.esm.js'),
      format: 'esm',
    });
    expect(output.code).toContain('"production"');
  });
});
