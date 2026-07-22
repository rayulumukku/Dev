import fs from 'fs';
import path from 'path';
import { RayCompiler } from '../compiler/index.js';
import { Resolver } from '../resolver/index.js';
import { transformCjsToEsm } from '../compiler/cjsTransform.js';
function normalizePath(p) {
    let resolved = path.resolve(p);
    if (process.platform === 'win32' && resolved[1] === ':') {
        resolved = resolved[0].toLowerCase() + resolved.slice(1);
    }
    return resolved.replace(/\\/g, '/');
}
export class RayBundler {
    compiler;
    resolver;
    visitedModules = new Map(); // file → compiled code
    moduleOrder = [];
    /** define() map made available to traverse() for pre-compile substitution */
    defineMap = {};
    constructor(projectRoot, define = {}) {
        this.compiler = new RayCompiler(define);
        this.resolver = new Resolver(projectRoot);
        this.defineMap = define;
    }
    // ─────────────────────────────────────────────────────────────────────
    // Module Resolution & Traversal
    // ─────────────────────────────────────────────────────────────────────
    resolveFile(specifier, importer) {
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
                if (fs.existsSync(c))
                    return c;
            }
        }
        return null; // bare specifier → external
    }
    extractImports(code) {
        const specifiers = [];
        // Static import
        const staticRe = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
        let m;
        while ((m = staticRe.exec(code)) !== null)
            specifiers.push(m[1]);
        // Dynamic import
        const dynRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((m = dynRe.exec(code)) !== null)
            specifiers.push(m[1]);
        // require()
        const reqRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
        while ((m = reqRe.exec(code)) !== null)
            specifiers.push(m[1]);
        return [...new Set(specifiers)];
    }
    async traverse(file, external) {
        const normFile = normalizePath(file);
        if (this.visitedModules.has(normFile))
            return;
        // Mark as visiting (cycle guard)
        this.visitedModules.set(normFile, '');
        let src = '';
        try {
            src = fs.readFileSync(normFile, 'utf-8');
        }
        catch {
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
        let compiled;
        try {
            const result = this.compiler.compile(src, normFile);
            compiled = result.code;
        }
        catch {
            compiled = src; // emit raw on compile failure
        }
        // Recurse dependencies
        const specifiers = this.extractImports(src);
        for (const spec of specifiers) {
            if (external.has(spec) || external.has(spec.split('/')[0]))
                continue;
            const resolved = this.resolveFile(spec, normFile);
            if (resolved)
                await this.traverse(resolved, external);
        }
        this.visitedModules.set(normFile, compiled);
        this.moduleOrder.push(normFile);
    }
    // ─────────────────────────────────────────────────────────────────────
    // Code Emission
    // ─────────────────────────────────────────────────────────────────────
    wrapModule(file, code, format) {
        if (format === 'esm')
            return code;
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
    applyDefine(code, define) {
        for (const [key, value] of Object.entries(define)) {
            code = code.replace(new RegExp(key.replace(/\./g, '\\.'), 'g'), value);
        }
        return code;
    }
    // ─────────────────────────────────────────────────────────────────────
    // Public Bundle API
    // ─────────────────────────────────────────────────────────────────────
    async bundle(options) {
        const external = new Set(options.external ?? []);
        const define = options.define ?? {};
        // Reset state per bundle (zero global state)
        this.visitedModules = new Map();
        this.moduleOrder = [];
        // Merge constructor-level defines with per-bundle defines; apply pre-compile (in traverse)
        this.defineMap = { 'process.env.NODE_ENV': '"production"', ...options.define };
        await this.traverse(options.entryPoint, external);
        // Assemble modules in traversal order
        const parts = [];
        let cssAccumulator = '';
        const getFileVarName = (filePath) => {
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
            // 1. Matches: import x from './y'
            const relativeImportRegex = /import\s+(\w+)\s+from\s+['"](\.\/|\.\.\/)([^'"]+)['"]\s*;?/g;
            code = code.replace(relativeImportRegex, (match, importedName, dotPrefix, relPath) => {
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
                    return `const ${importedName} = ${nestedVar};`;
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
                    const names = [];
                    const exportNameRegex = /\bexport\s+const\s+([a-zA-Z0-9_$]+)\b/g;
                    let m;
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
            // 3. For nested inlined modules, rewrite "export default" to a local binding assignment
            // and strip relative exports.
            if (!isEntry) {
                code = code.replace(/\bexport default\s+/g, `const ${varName} = `);
                code = code.replace(/export\s+const\s+[a-zA-Z0-9_$]+\s*=\s*__cjs_module_[a-zA-Z0-9_$]+__\.exports\.[a-zA-Z0-9_$]+;?/g, '');
                code = code.replace(/\bexport\s+(const|let|var|function|class)\s+/g, '$1 ');
                code = code.replace(/export\s+\*\s+from\s+['"](\.\/|\.\.\/)[^'"]+['"]\s*;?/g, '');
                code = code.replace(/export\s+{[^}]+}\s+from\s+['"](\.\/|\.\.\/)[^'"]+['"]\s*;?/g, '');
            }
            code = this.wrapModule(normFile, code, options.format);
            parts.push(`/* ${path.relative(path.dirname(normEntry), normFile)} */\n${code}`);
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
        if (options.banner)
            bundleCode = options.banner + '\n' + bundleCode;
        if (options.footer)
            bundleCode = bundleCode + '\n' + options.footer;
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
    async bundleFormats(entryPoint, outDir, formats, baseOptions) {
        const results = {};
        for (const fmt of formats) {
            const outFile = path.join(outDir, `index.${fmt}.js`);
            results[fmt] = await this.bundle({ entryPoint, outFile, format: fmt === 'umd' ? 'umd' : fmt, ...baseOptions });
        }
        return results;
    }
}
//# sourceMappingURL=rayBundler.js.map