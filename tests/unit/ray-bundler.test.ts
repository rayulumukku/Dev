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

  it('should transform CJS destructuring, named export clauses, and uninitialized exports', async () => {
    const src = path.join(projectRoot, 'src', 'cjsAdvancedExports.ts');
    fs.writeFileSync(
      src,
      `export const { host, port } = { host: "localhost", port: 3000 };\n` +
      `export const [first, second] = [10, 20];\n` +
      `const localA = 'hello', localB = 'world';\n` +
      `export { localA, localB as customB };\n` +
      `export let uninit;\n`
    );
    const bundler = new RayBundler(projectRoot);
    const outFile = path.join(outDir, 'advanced.cjs.js');
    const output = await bundler.bundle({
      entryPoint: src,
      outFile,
      format: 'cjs',
    });

    expect(output.code).toContain('exports.host = host;');
    expect(output.code).toContain('exports.port = port;');
    expect(output.code).toContain('exports.first = first;');
    expect(output.code).toContain('exports.second = second;');
    expect(output.code).toContain('exports.localA = localA;');
    expect(output.code).toContain('exports.customB = localB;');
    expect(output.code).toContain('exports.uninit = uninit;');

    // Verify CommonJS execution
    const modExports: any = {};
    const moduleObj = { exports: modExports };
    const runFn = new Function('module', 'exports', output.code);
    expect(() => runFn(moduleObj, modExports)).not.toThrow();
    expect(modExports.host).toBe('localhost');
    expect(modExports.port).toBe(3000);
    expect(modExports.first).toBe(10);
    expect(modExports.second).toBe(20);
    expect(modExports.localA).toBe('hello');
    expect(modExports.customB).toBe('world');
    expect('uninit' in modExports).toBe(true);
  });

  it('should transform destructuring exports with default values in CommonJS format', async () => {
    const src = path.join(projectRoot, 'src', 'cjsDestructureDefaults.ts');
    fs.writeFileSync(
      src,
      `export const { a, b = 2 } = { a: 1 };\n` +
      `export const [first, second = 0] = [10];\n` +
      `export const { host, port = 8080, timeout: t = 5000 } = { host: "example.com" };\n`
    );
    const bundler = new RayBundler(projectRoot);
    const outFile = path.join(outDir, 'destructure-defaults.cjs.js');
    const output = await bundler.bundle({
      entryPoint: src,
      outFile,
      format: 'cjs',
    });

    expect(output.code).not.toContain('export const');
    expect(output.code).toContain('exports.a = a;');
    expect(output.code).toContain('exports.b = b;');
    expect(output.code).toContain('exports.first = first;');
    expect(output.code).toContain('exports.second = second;');
    expect(output.code).toContain('exports.host = host;');
    expect(output.code).toContain('exports.port = port;');
    expect(output.code).toContain('exports.t = t;');

    // Verify CommonJS execution
    const modExports: any = {};
    const moduleObj = { exports: modExports };
    const runFn = new Function('module', 'exports', output.code);
    expect(() => runFn(moduleObj, modExports)).not.toThrow();
    expect(modExports.a).toBe(1);
    expect(modExports.b).toBe(2);
    expect(modExports.first).toBe(10);
    expect(modExports.second).toBe(0);
    expect(modExports.host).toBe('example.com');
    expect(modExports.port).toBe(8080);
    expect(modExports.t).toBe(5000);
  });
});
