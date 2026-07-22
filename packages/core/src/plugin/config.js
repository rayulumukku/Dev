import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
/**
 * loadConfig
 *
 * Dynamically transpiles and evaluates the ray.config.ts / ray.config.js
 * configuration file using Ray's own compiler — no esbuild dependency.
 *
 * Strategy:
 *  1. Read source with fs
 *  2a. If it is a .js file: write directly as .mjs temp file (already valid ESM)
 *  2b. If it is a .ts file: apply lightweight TypeScript stripping (remove type
 *      annotations, interface blocks) and write as .mjs temp file
 *  3. dynamic import() the temp file
 *  4. Clean up the temp file
 *
 * This avoids feeding config files through Ray's full AST→codegen pipeline which
 * can produce malformed output for complex object literals.
 */
export async function loadConfig(projectRoot) {
    const tsConfigPath = path.join(projectRoot, 'ray.config.ts');
    const jsConfigPath = path.join(projectRoot, 'ray.config.js');
    let configPath = '';
    let isTypeScript = false;
    if (fs.existsSync(tsConfigPath)) {
        configPath = tsConfigPath;
        isTypeScript = true;
    }
    else if (fs.existsSync(jsConfigPath)) {
        configPath = jsConfigPath;
        isTypeScript = false;
    }
    else {
        return { plugins: [] };
    }
    let src = fs.readFileSync(configPath, 'utf-8');
    // For TypeScript config files: strip type annotations using lightweight regex
    // transforms — intentionally NOT routing through Ray's full AST pipeline to
    // avoid codegen issues with complex object literal constructs.
    if (isTypeScript) {
        src = stripTypeScript(src);
    }
    const tempOut = path.join(projectRoot, '.ray', `config.timestamp.${Date.now()}.mjs`);
    fs.mkdirSync(path.dirname(tempOut), { recursive: true });
    fs.writeFileSync(tempOut, src, 'utf-8');
    try {
        const configUrl = pathToFileURL(tempOut).toString() + `?t=${Date.now()}`;
        const mod = await import(/* @vite-ignore */ configUrl);
        return mod.default || mod;
    }
    finally {
        try {
            if (fs.existsSync(tempOut))
                fs.unlinkSync(tempOut);
        }
        catch {
            // Silently ignore cleanup failure
        }
    }
}
/**
 * Lightweight TypeScript syntax stripper.
 *
 * Handles the common patterns found in ray.config.ts files:
 * - `import type { ... }` statements
 * - `interface Foo { ... }` blocks
 * - `: Type` annotations on function params and variable declarations
 * - `as Type` casts
 * - Generic type parameters `<T>` on non-JSX calls
 */
function stripTypeScript(src) {
    // Remove `import type` statements
    src = src.replace(/^import\s+type\s+[^\n]+\n/gm, '');
    // Remove `interface ... { ... }` blocks (multi-line)
    src = src.replace(/\binterface\s+\w[\w\d]*\s*(\<[^>]+\>)?\s*\{[^}]*\}/gs, '');
    // Remove `type Alias = ...;` declarations
    src = src.replace(/^type\s+\w[\w\d]*\s*=\s*[^;]+;/gm, '');
    // Remove `: TypeAnnotation` from variable declarations (const/let/var x: Type = ...)
    src = src.replace(/\b(const|let|var)\s+(\w+)\s*:\s*[A-Za-z0-9_<>,\s\[\]|&\?\.]*(?=\s*=|\s*;)/g, '$1 $2');
    // Remove `: TypeAnnotation` from function parameters using a safe whitelist of types
    src = src.replace(/:\s*(?:ConfigEnv|UserConfig|RayConfig|any|string|number|boolean|object|void|unknown|never|Record|Array)\b/g, '');
    // Remove `as Type` casts (but not `async`)
    src = src.replace(/\bas\s+[A-Z]\w*/g, '');
    // Remove leading/trailing whitespace artifacts
    src = src.replace(/\n{3,}/g, '\n\n');
    return src;
}
//# sourceMappingURL=config.js.map