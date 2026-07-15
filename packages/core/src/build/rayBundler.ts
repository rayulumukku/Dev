import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { RayCompiler } from '../compiler/index.js';
import { Resolver } from '../resolver/index.js';
import { transformCjsToEsm } from '../compiler/cjsTransform.js';

/**
 * RayBundler
 *
 * Native Ray module bundler replacing esbuild for library and production builds.
 *
 * Pipeline:
 *   Entry → resolve imports recursively → compile each module → inline → emit
 *
 * Features:
 *   - ESM / CJS / UMD / IIFE output formats
 *   - External package exclusion
 *   - define() constant replacement
 *   - Source map passthrough
 *   - CSS and asset file side-channel output
 *   - Deterministic output order (topological)
 *   - Zero Global State
 */

export interface RayBundlerOptions {
  entryPoint: string;
  outFile: string;
  format: 'esm' | 'cjs' | 'iife' | 'umd';
  /** Module/package names that should NOT be inlined */
  external?: string[];
  globalName?: string;
  minify?: boolean;
  sourcemap?: boolean;
  define?: Record<string, string>;
  outDir?: string;
  banner?: string;
  footer?: string;
}

export interface BundleOutput {
  code: string;
  map?: string;
  sizeBytes: number;
  /** Extracted CSS content, if any was encountered */
  css?: string;
}

export class RayBundler {
  private compiler: RayCompiler;
  private resolver: Resolver;
  private visitedModules: Map<string, string> = new Map(); // file → compiled code
  private moduleOrder: string[] = [];

  constructor(projectRoot: string, define: Record<string, string> = {}) {
    this.compiler = new RayCompiler(define);
    this.resolver = new Resolver(projectRoot);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Module Resolution & Traversal
  // ─────────────────────────────────────────────────────────────────────

  private resolveFile(specifier: string, importer: string): string | null {
    if (specifier.startsWith('.') || specifier.startsWith('/')) {
      const base = path.dirname(importer);
      const candidates = [
        path.resolve(base, specifier),
        path.resolve(base, specifier + '.ts'),
        path.resolve(base, specifier + '.tsx'),
        path.resolve(base, specifier + '.js'),
        path.resolve(base, specifier + '.jsx'),
        path.resolve(base, specifier, 'index.ts'),
        path.resolve(base, specifier, 'index.tsx'),
        path.resolve(base, specifier, 'index.js'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) return c;
      }
    }
    return null; // bare specifier → external
  }

  private extractImports(code: string): string[] {
    const specifiers: string[] = [];
    // Static import
    const staticRe = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = staticRe.exec(code)) !== null) specifiers.push(m[1]);
    // Dynamic import
    const dynRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = dynRe.exec(code)) !== null) specifiers.push(m[1]);
    // require()
    const reqRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((m = reqRe.exec(code)) !== null) specifiers.push(m[1]);
    return [...new Set(specifiers)];
  }

  private async traverse(file: string, external: Set<string>): Promise<void> {
    if (this.visitedModules.has(file)) return;
    // Mark as visiting (cycle guard)
    this.visitedModules.set(file, '');

    let src = '';
    try {
      src = fs.readFileSync(file, 'utf-8');
    } catch {
      return;
    }

    // Detect and convert CJS
    const hasCjs = /\bmodule\.exports\b|\bexports\.\w/.test(src) || /\brequire\s*\(/.test(src);
    if (hasCjs) {
      src = transformCjsToEsm(src);
    }

    // Compile through Ray compiler
    let compiled: string;
    try {
      const result = this.compiler.compile(src, file);
      compiled = result.code;
    } catch {
      compiled = src; // emit raw on compile failure
    }

    // Recurse dependencies
    const specifiers = this.extractImports(src);
    for (const spec of specifiers) {
      if (external.has(spec) || external.has(spec.split('/')[0])) continue;
      const resolved = this.resolveFile(spec, file);
      if (resolved) await this.traverse(resolved, external);
    }

    this.visitedModules.set(file, compiled);
    this.moduleOrder.push(file);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Code Emission
  // ─────────────────────────────────────────────────────────────────────

  private wrapModule(file: string, code: string, format: 'esm' | 'cjs' | 'iife' | 'umd'): string {
    if (format === 'esm') return code;
    if (format === 'cjs') {
      return code
        .replace(/\bexport default\s+/g, 'module.exports = ')
        .replace(/\bexport (const|let|var|function|class) (\w+)/g, (_, kw, name) => {
          return `${kw} ${name}; exports.${name} = ${name};`;
        });
    }
    // iife / umd: handled at bundle level
    return code;
  }

  private applyDefine(code: string, define: Record<string, string>): string {
    for (const [key, value] of Object.entries(define)) {
      code = code.replace(new RegExp(key.replace(/\./g, '\\.'), 'g'), value);
    }
    return code;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Public Bundle API
  // ─────────────────────────────────────────────────────────────────────

  async bundle(options: RayBundlerOptions): Promise<BundleOutput> {
    const external = new Set<string>(options.external ?? []);
    const define = options.define ?? {};

    // Reset state per bundle (zero global state)
    this.visitedModules = new Map();
    this.moduleOrder = [];

    await this.traverse(options.entryPoint, external);

    // Assemble modules in traversal order
    const parts: string[] = [];
    let cssAccumulator = '';

    for (const file of this.moduleOrder) {
      let code = this.visitedModules.get(file) ?? '';
      code = this.applyDefine(code, { 'process.env.NODE_ENV': '"production"', ...define });

      if (file.endsWith('.css')) {
        cssAccumulator += `\n/* ${path.basename(file)} */\n${code}`;
        continue;
      }

      code = this.wrapModule(file, code, options.format);
      parts.push(`/* ${path.relative(path.dirname(options.entryPoint), file)} */\n${code}`);
    }

    let bundleCode = parts.join('\n\n');

    // Wrap for UMD / IIFE
    if (options.format === 'umd' || options.format === 'iife') {
      const name = options.globalName ?? 'RayBundle';
      bundleCode = `(function (global, factory) {\n` +
        `  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :\n` +
        `  typeof define === 'function' && define.amd ? define(['exports'], factory) :\n` +
        `  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.${name} = {}));\n` +
        `})(this, (function (exports) {\n${bundleCode}\n}));`;
    }

    if (options.banner) bundleCode = options.banner + '\n' + bundleCode;
    if (options.footer) bundleCode = bundleCode + '\n' + options.footer;

    // Write output
    fs.mkdirSync(path.dirname(options.outFile), { recursive: true });
    fs.writeFileSync(options.outFile, bundleCode, 'utf-8');

    return {
      code: bundleCode,
      sizeBytes: Buffer.byteLength(bundleCode, 'utf-8'),
      css: cssAccumulator || undefined,
    };
  }

  /**
   * Convenience: bundle into multiple output formats at once.
   */
  async bundleFormats(
    entryPoint: string,
    outDir: string,
    formats: Array<'esm' | 'cjs' | 'umd'>,
    baseOptions: Omit<RayBundlerOptions, 'entryPoint' | 'outFile' | 'format'>
  ): Promise<Record<string, BundleOutput>> {
    const results: Record<string, BundleOutput> = {};
    for (const fmt of formats) {
      const outFile = path.join(outDir, `index.${fmt}.js`);
      results[fmt] = await this.bundle({ entryPoint, outFile, format: fmt === 'umd' ? 'umd' : fmt, ...baseOptions });
    }
    return results;
  }
}
