import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { RayCompiler } from '../compiler/index.js';
import { Resolver } from '../resolver/index.js';
import { transformCjsToEsm } from '../compiler/cjsTransform.js';

function normalizePath(p: string): string {
  let resolved = path.resolve(p);
  if (process.platform === 'win32' && resolved[1] === ':') {
    resolved = resolved[0].toLowerCase() + resolved.slice(1);
  }
  return resolved.replace(/\\/g, '/');
}

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
  /** define() map made available to traverse() for pre-compile substitution */
  private defineMap: Record<string, string> = {};
  private container?: any;

  constructor(projectRoot: string, define: Record<string, string> = {}, container?: any) {
    this.compiler = new RayCompiler(define);
    this.resolver = new Resolver(projectRoot);
    this.defineMap = define;
    this.container = container;
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
    const normFile = normalizePath(file);
    if (this.visitedModules.has(normFile)) return;
    // Mark as visiting (cycle guard)
    this.visitedModules.set(normFile, '');

    let src = '';
    try {
      src = fs.readFileSync(normFile, 'utf-8');
    } catch {
      return;
    }

    // Apply define() substitutions on the SOURCE before compilation so that
    // the compiler / optimizer sees literal values (avoids premature pruning)
    if (this.defineMap) {
      src = this.applyDefine(src, this.defineMap);
    }

    // Detect and convert CJS
    const hasCjs = /\bmodule\.exports\b|\bexports\.\w/.test(src) || /\brequire\s*\(/.test(src);
    if (hasCjs) {
      src = transformCjsToEsm(src);
    }

    // Compile through Ray compiler
    let compiled: string;
    try {
      const result = this.compiler.compile(src, normFile);
      compiled = result.code;
    } catch {
      compiled = src; // emit raw on compile failure
    }

    // Recurse dependencies
    const specifiers = this.extractImports(src);
    for (const spec of specifiers) {
      if (external.has(spec) || external.has(spec.split('/')[0])) continue;
      const resolved = this.resolveFile(spec, normFile);
      if (resolved) {
        await this.traverse(resolved, external);
      } else if (this.container) {
        try {
          const resolvedId = await this.container.resolveId(spec, normFile);
          if (resolvedId && (resolvedId.startsWith('\0') || resolvedId.startsWith('virtual:'))) {
            const normVirt = normalizePath(spec);
            if (!this.visitedModules.has(normVirt)) {
              this.visitedModules.set(normVirt, '');
              const loaded = await this.container.load(resolvedId);
              if (loaded !== null) {
                let compiledVirt = loaded;
                try {
                  compiledVirt = this.compiler.compile(loaded, normVirt).code;
                } catch {}
                this.visitedModules.set(normVirt, compiledVirt);
                this.moduleOrder.push(normVirt);
              }
            }
          }
        } catch {
          // ignore virtual resolution errors
        }
      }
    }

    this.visitedModules.set(normFile, compiled);
    this.moduleOrder.push(normFile);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Code Emission
  // ─────────────────────────────────────────────────────────────────────

  private wrapModule(file: string, code: string, format: 'esm' | 'cjs' | 'iife' | 'umd'): string {
    if (format === 'esm') return code;
    if (format === 'cjs') {
      return code
        .replace(/\bexport default\s+/g, 'module.exports = ')
        // Destructuring exports: export const { a, b } = expr or export const [a, b] = arr
        .replace(/\bexport (const|let|var)\s+(\{[^;\n]+\}|\[[^;\n]+\])\s*=\s*([^;\n]+)(;?)/g, (_match, kw, pattern, rhs, semi) => {
          const names: string[] = [];
          const inner = pattern.slice(1, -1);
          for (let part of inner.split(',')) {
            part = part.trim();
            if (!part) continue;
            if (part.includes('=')) part = part.split('=')[0].trim();
            if (part.includes(':')) part = part.split(':')[1].trim();
            if (part.startsWith('...')) part = part.slice(3).trim();
            const m = part.match(/^[a-zA-Z0-9_$]+/);
            if (m) names.push(m[0]);
          }
          const assignments = names.map(n => `exports.${n} = ${n};`).join(' ');
          return `${kw} ${pattern} = ${rhs}${semi || ';'}\n${assignments}`;
        })
        // Uninitialized variable exports: export let a; or export var a, b;
        .replace(/\bexport (let|var)\s+([^=;\n]+)\s*;/g, (_match, kw, decls) => {
          const names = decls.split(',').map((s: string) => s.trim()).filter((s: string) => /^[a-zA-Z0-9_$]+$/.test(s));
          if (names.length > 0) {
            const assignments = names.map((n: string) => `exports.${n} = ${n};`).join(' ');
            return `${kw} ${decls};\n${assignments}`;
          }
          return `${kw} ${decls};`;
        })
        // Named export clauses: export { a, b }; or export { a as x };
        .replace(/\bexport\s*\{([^}]+)\}(?!\s*from)\s*;?/g, (_match, list) => {
          return list.split(',').map((s: string) => {
            s = s.trim();
            if (!s) return '';
            const parts = s.split(/\s+as\s+/);
            const localName = parts[0].trim();
            const exportName = parts[1] ? parts[1].trim() : localName;
            return `exports.${exportName} = ${localName};`;
          }).filter(Boolean).join(' ');
        })
        // Simple variable exports: export const/let/var x = ...
        .replace(/\bexport (const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/g, '$1 $2 = exports.$2 = ')
        // Function exports
        .replace(/\bexport (async\s+)?function\s+(\w+)/g, (_, asyncKw, name) => {
          return `exports.${name} = ${name}; ${asyncKw || ''}function ${name}`;
        })
        // Class exports
        .replace(/\bexport class\s+(\w+)/g, 'const $1 = exports.$1 = class $1');
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
    // Merge constructor-level defines with per-bundle defines; apply pre-compile (in traverse)
    this.defineMap = { 'process.env.NODE_ENV': '"production"', ...options.define };

    await this.traverse(options.entryPoint, external);

    // Assemble modules in traversal order
    const parts: string[] = [];
    let cssAccumulator = '';

    const getFileVarName = (filePath: string): string => {
      const norm = normalizePath(filePath);
      let hash = 0;
      for (let i = 0; i < norm.length; i++) {
        hash = (hash << 5) - hash + norm.charCodeAt(i);
        hash |= 0;
      }
      return `__bundle_mod_${Math.abs(hash).toString(36)}__`;
    };

    const normEntry = normalizePath(options.entryPoint);

    for (const file of this.moduleOrder) {
      const normFile = normalizePath(file);
      let code = this.visitedModules.get(normFile) ?? '';

      if (normFile.endsWith('.css')) {
        cssAccumulator += `\n/* ${path.basename(normFile)} */\n${code}`;
        continue;
      }

      const isEntry = (normFile === normEntry);
      const varName = getFileVarName(normFile);
      const dir = path.dirname(normFile);

      // 1. Matches: inlined module imports (relative or virtual)
      const inlinedImportRegex = /import\s+((?:[\w$]+|\{[^}]*\}|[\w$]+\s*,\s*\{[^}]*\}|\*\s*as\s+[\w$]+))\s+from\s+['"]([^'"]+)['"]\s*;?/g;
      code = code.replace(inlinedImportRegex, (match, clause, spec) => {
        let targetNorm: string | null = null;
        if (spec.startsWith('.') || spec.startsWith('/')) {
          let nestedPath = path.resolve(dir, spec);
          if (!path.extname(nestedPath)) {
            for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.mjs']) {
              if (fs.existsSync(nestedPath + ext)) {
                nestedPath += ext;
                break;
              }
            }
          }
          targetNorm = normalizePath(nestedPath);
        } else {
          const normVirt = normalizePath(spec);
          if (this.visitedModules.has(normVirt)) {
            targetNorm = normVirt;
          }
        }

        if (targetNorm && this.visitedModules.has(targetNorm)) {
          const nestedVar = getFileVarName(targetNorm);
          clause = clause.trim();
          if (clause.startsWith('* as ')) {
            const ns = clause.slice(5).trim();
            return `const ${ns} = ${nestedVar};`;
          }
          if (clause.startsWith('{')) {
            return `const ${clause} = ${nestedVar};`;
          }
          if (clause.includes(',')) {
            const parts = clause.split(',');
            const def = parts[0].trim();
            const named = parts.slice(1).join(',').trim();
            return `const ${def} = ${nestedVar};\nconst ${named} = ${nestedVar};`;
          }
          return `const ${clause} = ${nestedVar};`;
        }
        return match;
      });

      // 2. Matches side-effect: import './y'
      const relativeSideEffectRegex = /import\s+['"](\.\/|\.\.\/)([^'"]+)['"]\s*;?/g;
      code = code.replace(relativeSideEffectRegex, (match, dotPrefix, relPath) => {
        let nestedPath = path.resolve(dir, dotPrefix + relPath);
        if (!path.extname(nestedPath)) {
          for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.mjs']) {
            if (fs.existsSync(nestedPath + ext)) {
              nestedPath += ext;
              break;
            }
          }
        }
        const normNested = normalizePath(nestedPath);
        if (this.visitedModules.has(normNested)) {
          return `/* Inlined: ${path.basename(normNested)} */`;
        }
        return match;
      });

      // Matches: export * from './y'
      const relativeExportAllRegex = /export\s+\*\s+from\s+['"](\.\/|\.\.\/)([^'"]+)['"]\s*;?/g;
      code = code.replace(relativeExportAllRegex, (match, dotPrefix, relPath) => {
        let nestedPath = path.resolve(dir, dotPrefix + relPath);
        if (!path.extname(nestedPath)) {
          for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.mjs']) {
            if (fs.existsSync(nestedPath + ext)) {
              nestedPath += ext;
              break;
            }
          }
        }
        const normNested = normalizePath(nestedPath);
        if (this.visitedModules.has(normNested)) {
          const nestedVar = getFileVarName(normNested);
          const nestedCode = this.visitedModules.get(normNested) ?? '';
          const names: string[] = [];
          const exportNameRegex = /\bexport\s+const\s+([a-zA-Z0-9_$]+)\b/g;
          let m: RegExpExecArray | null;
          while ((m = exportNameRegex.exec(nestedCode)) !== null) {
            names.push(m[1]);
          }
          if (names.length > 0) {
            return names.map(name => `export const ${name} = ${nestedVar}.${name};`).join('\n');
          }
          return `/* Inlined export * from: ${path.basename(normNested)} */`;
        }
        return match;
      });

      // 3. For nested inlined modules, rewrite exports to local bindings and isolate scope
      if (!isEntry) {
        const exportedNames: string[] = [];
        code = code.replace(/\bexport\s+(?:const|let|var)\s+(\{[^;\n]+\}|\[[^;\n]+\])\s*=/g, (_m, pattern) => {
          const inner = pattern.slice(1, -1);
          for (let part of inner.split(',')) {
            part = part.trim();
            if (!part) continue;
            if (part.includes('=')) part = part.split('=')[0].trim();
            if (part.includes(':')) part = part.split(':')[1].trim();
            if (part.startsWith('...')) part = part.slice(3).trim();
            const match = part.match(/^[a-zA-Z0-9_$]+/);
            if (match) exportedNames.push(match[0]);
          }
          return `const ${pattern} =`;
        });
        code = code.replace(/\bexport\s+(?:let|var)\s+([a-zA-Z0-9_$]+)\s*;/g, (_m, n) => {
          exportedNames.push(n);
          return `let ${n};`;
        });
        code = code.replace(/\bexport\s+(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/g, (_m, n) => {
          exportedNames.push(n);
          return `const ${n} =`;
        });
        code = code.replace(/\bexport\s+function\s+([a-zA-Z0-9_$]+)/g, (_m, n) => {
          exportedNames.push(n);
          return `function ${n}`;
        });
        code = code.replace(/\bexport\s+class\s+([a-zA-Z0-9_$]+)/g, (_m, n) => {
          exportedNames.push(n);
          return `class ${n}`;
        });
        code = code.replace(/\bexport\s+\{([^}]+)\}\s*;?/g, (_m, list) => {
          list.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((s: string) => {
            const parts = s.split(/\s+as\s+/);
            const localName = parts[0].trim();
            const exportName = parts[1] ? parts[1].trim() : localName;
            exportedNames.push(exportName === localName ? localName : `${exportName}: ${localName}`);
          });
          return '';
        });

        let returnStmt = '';
        if (code.includes('export default')) {
          code = code.replace(/\bexport default\s+/g, `const __default_export__ = `);
          if (exportedNames.length > 0) {
            returnStmt = `return Object.assign(__default_export__, { ${exportedNames.join(', ')} });`;
          } else {
            returnStmt = `return __default_export__;`;
          }
        } else if (exportedNames.length > 0) {
          returnStmt = `return { ${exportedNames.join(', ')} };`;
        } else {
          returnStmt = `return {};`;
        }

        code = code.replace(/export\s+const\s+[a-zA-Z0-9_$]+\s*=\s*__cjs_module_[a-zA-Z0-9_$]+__\.exports\.[a-zA-Z0-9_$]+;?/g, '');
        code = code.replace(/export\s+\*\s+from\s+['"][^'"]+['"]\s*;?/g, '');
        code = code.replace(/export\s+{[^}]+}\s+from\s+['"][^'"]+['"]\s*;?/g, '');

        code = `const ${varName} = (() => {\n${code}\n${returnStmt}\n})();`;
      } else {
        code = this.wrapModule(normFile, code, options.format);
      }
      parts.push(`/* ${path.relative(path.dirname(normEntry), normFile)} */\n${code}`);
    }

    let bundleCode = parts.join('\n\n');

    if (options.format === 'esm') {
      bundleCode = this.hoistAndDeduplicateImports(bundleCode);
    }

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

  private hoistAndDeduplicateImports(code: string): string {
    const map = new Map<string, { defaultName: string | null; namespace: string | null; named: Set<string> }>();
    const sideEffects = new Set<string>();

    const importRegex = /import\s+((?:[\w$]+|\{[^}]*\}|[\w$]+\s*,\s*\{[^}]*\}|\*\s*as\s+[\w$]+))\s+from\s+['"]([^'"]+)['"]\s*;?/g;
    let stripped = code.replace(importRegex, (match, clause, pkg) => {
      if (pkg.startsWith('.') || pkg.startsWith('/')) return match;
      if (!map.has(pkg)) {
        map.set(pkg, { defaultName: null, namespace: null, named: new Set<string>() });
      }
      const rec = map.get(pkg)!;
      clause = clause.trim();
      if (clause.startsWith('* as ')) {
        rec.namespace = clause.slice(5).trim();
      } else if (clause.startsWith('{')) {
        clause.slice(1, -1).split(',').map((s: string) => s.trim()).filter(Boolean).forEach((s: string) => rec.named.add(s));
      } else if (clause.includes(',')) {
        const parts = clause.split(',');
        rec.defaultName = parts[0].trim();
        parts.slice(1).join(',').replace(/[{}]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean).forEach((s: string) => rec.named.add(s));
      } else {
        rec.defaultName = clause.trim();
      }
      return '';
    });

    const sideEffectRegex = /import\s+['"]([^'"]+)['"]\s*;?/g;
    stripped = stripped.replace(sideEffectRegex, (match, pkg) => {
      if (pkg.startsWith('.') || pkg.startsWith('/')) return match;
      sideEffects.add(pkg);
      return '';
    });

    const headers: string[] = [];
    for (const pkg of sideEffects) {
      headers.push(`import '${pkg}';`);
    }
    for (const [pkg, rec] of map.entries()) {
      if (rec.namespace) {
        headers.push(`import * as ${rec.namespace} from '${pkg}';`);
      } else if (rec.defaultName && rec.named.size > 0) {
        headers.push(`import ${rec.defaultName}, { ${Array.from(rec.named).join(', ')} } from '${pkg}';`);
      } else if (rec.defaultName) {
        headers.push(`import ${rec.defaultName} from '${pkg}';`);
      } else if (rec.named.size > 0) {
        headers.push(`import { ${Array.from(rec.named).join(', ')} } from '${pkg}';`);
      }
    }

    if (headers.length === 0) return stripped;
    return headers.join('\n') + '\n\n' + stripped.trimStart();
  }
}
