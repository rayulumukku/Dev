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
export async function loadConfig(projectRoot: string) {
  const tsConfigPath = path.join(projectRoot, 'ray.config.ts');
  const jsConfigPath = path.join(projectRoot, 'ray.config.js');

  let configPath = '';
  let isTypeScript = false;

  if (fs.existsSync(tsConfigPath)) {
    configPath = tsConfigPath;
    isTypeScript = true;
  } else if (fs.existsSync(jsConfigPath)) {
    configPath = jsConfigPath;
    isTypeScript = false;
  } else {
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
  } finally {
    try {
      if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
    } catch {
      // Silently ignore cleanup failure
    }
  }
}

function stripTypeAnnotations(src: string): string {
  let changed = true;
  while (changed) {
    changed = false;
    let i = 0;
    while (i < src.length) {
      // Skip string literals
      if (src[i] === "'" || src[i] === '"' || src[i] === '`') {
        const quote = src[i];
        i++;
        while (i < src.length && src[i] !== quote) {
          if (src[i] === '\\') i++;
          i++;
        }
        if (i < src.length) i++;
        continue;
      }
      // Skip single-line comments
      if (src[i] === '/' && src[i + 1] === '/') {
        i += 2;
        while (i < src.length && src[i] !== '\n') i++;
        continue;
      }
      // Skip multi-line comments
      if (src[i] === '/' && src[i + 1] === '*') {
        i += 2;
        while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
        if (i < src.length) i += 2;
        continue;
      }

      let keyword = '';
      if (src.slice(i).match(/^satisfies\b/)) {
        keyword = 'satisfies';
      } else if (src.slice(i).match(/^as\b/)) {
        const before = src.slice(0, i);
        const isImportExportAs = /\*\s*$/.test(before) ||
          /(?:^|\n)\s*import\b[^;]*$/.test(before) ||
          /(?:^|\n)\s*export\s*\{[^}]*$/.test(before);
        if (!isImportExportAs) {
          keyword = 'as';
        }
      }

      if (keyword) {
        const prevChar = i > 0 ? src[i - 1] : ' ';
        if (!/[a-zA-Z0-9_$]/.test(prevChar)) {
          let pos = i + keyword.length;
          if (pos < src.length && /\s/.test(src[pos])) {
            while (pos < src.length && /\s/.test(src[pos])) pos++;
            let angleDepth = 0;
            let bracketDepth = 0;
            let parenDepth = 0;
            let braceDepth = 0;
            let typeEnd = pos;

            while (typeEnd < src.length) {
              const ch = src[typeEnd];

              if (angleDepth === 0 && bracketDepth === 0 && parenDepth === 0 && braceDepth === 0) {
                if (ch === ';' || ch === ',' || ch === '}' || ch === ']' || ch === ')') {
                  break;
                }
                if (ch === '\n') {
                  break;
                }
                if (ch === 'a' && src.slice(typeEnd).match(/^as\s+/)) {
                  break;
                }
                if (ch === 's' && src.slice(typeEnd).match(/^satisfies\s+/)) {
                  break;
                }
              }

              if (ch === "'" || ch === '"' || ch === '`') {
                const q = ch;
                typeEnd++;
                while (typeEnd < src.length && src[typeEnd] !== q) {
                  if (src[typeEnd] === '\\') typeEnd++;
                  typeEnd++;
                }
                if (typeEnd < src.length) typeEnd++;
                continue;
              }

              if (ch === '<') angleDepth++;
              else if (ch === '>') {
                if (angleDepth > 0) angleDepth--;
                else break;
              } else if (ch === '[') bracketDepth++;
              else if (ch === ']') {
                if (bracketDepth > 0) bracketDepth--;
                else break;
              } else if (ch === '(') parenDepth++;
              else if (ch === ')') {
                if (parenDepth > 0) parenDepth--;
                else break;
              } else if (ch === '{') braceDepth++;
              else if (ch === '}') {
                if (braceDepth > 0) braceDepth--;
                else break;
              }

              typeEnd++;
            }

            if (typeEnd > pos) {
              src = src.slice(0, i) + src.slice(typeEnd);
              changed = true;
              break;
            }
          }
        }
      }

      i++;
    }
  }
  return src;
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
export function stripTypeScript(src: string): string {
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

  // Remove `as Type` casts and `satisfies Type` expressions
  src = stripTypeAnnotations(src);

  // Remove leading/trailing whitespace artifacts
  src = src.replace(/\n{3,}/g, '\n\n');

  return src;
}
