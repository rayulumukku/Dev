/**
 * Transforms a CommonJS format module string to ESM.
 * Wraps CJS module code inside a function closure (IIFE) to isolate variable scopes
 * and prevent duplicate declaration errors under ESM.
 */
export function transformCjsToEsm(code) {
    let transformed = code;
    // 1. Pre-evaluate process.env.NODE_ENV conditionals for common wrapper patterns (e.g. react/index.js)
    // Handles both raw process.env.NODE_ENV and pre-substituted literal 'production' / 'development'
    transformed = transformed.replace(/if\s*\(\s*(?:process\.env\.NODE_ENV|['"](?:production|development)['"])\s*===\s*['"]production['"]\s*\)\s*\{\s*module\.exports\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\);?\s*\}\s*else\s*\{\s*module\.exports\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\);?\s*\}/g, (match, prodTarget, devTarget) => {
        const isProd = process.env.NODE_ENV === 'production' || match.includes("'production' ===");
        return isProd ? `module.exports = require("${prodTarget}");` : `module.exports = require("${devTarget}");`;
    });
    const delegateMatch = /^(?:'use strict';?\s*)?module\.exports\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\);?\s*$/i.exec(transformed.trim());
    if (delegateMatch) {
        const target = delegateMatch[1];
        return `import __cjs_delegate_default__ from "${target}";\nexport default __cjs_delegate_default__;\nexport * from "${target}";`;
    }
    // Generate a unique identifier suffix to avoid clashing inside bundled files
    const uid = Math.random().toString(36).substring(2, 10);
    // 3. Extract and convert require(...) expressions to top level static imports
    const imports = [];
    let depCount = 0;
    transformed = transformed.replace(/require\(\s*['"]([^'"]+)['"]\s*\)/g, (match, specifier) => {
        const depName = `__cjs_dep_${uid}_${depCount++}__`;
        imports.push(`import ${depName} from "${specifier}";`);
        return depName;
    });
    // 4. Standardize module.exports.foo to exports.foo
    transformed = transformed.replace(/module\.exports\.([a-zA-Z0-9_$]+)/g, 'exports.$1');
    // 5. Collect all exports.foo properties to generate named exports at the end
    const exportNames = new Set();
    const exportRegex = /\bexports\.([a-zA-Z0-9_$]+)\b/g;
    let match;
    while ((match = exportRegex.exec(transformed)) !== null) {
        exportNames.add(match[1]);
    }
    // 6. Wrap the CJS code inside a function enclosure to prevent identifier collisions
    let wrapperCode = `
const __cjs_exports_${uid}__ = {};
const __cjs_module_${uid}__ = { exports: __cjs_exports_${uid}__ };
(function(module, exports) {
${transformed}
})(__cjs_module_${uid}__, __cjs_exports_${uid}__);
`;
    // 7. Generate final exports
    let bottomExports = `\nexport default __cjs_module_${uid}__.exports;\n`;
    for (const name of exportNames) {
        bottomExports += `export const ${name} = __cjs_module_${uid}__.exports.${name};\n`;
    }
    // 8. Combine into a clean ESM module
    const result = imports.join('\n') + '\n' + wrapperCode + bottomExports;
    return result;
}
//# sourceMappingURL=cjsTransform.js.map