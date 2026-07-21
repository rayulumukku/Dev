import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { ConfigEnv } from '../types.js';

/**
 * Normalizes configuration source code across TypeScript, CommonJS, and ES Module variants.
 */
function normalizeSourceCode(src: string, isTs: boolean): string {
  let code = src;

  if (isTs) {
    // 1. Remove `import type` statements
    code = code.replace(/import\s+type\s+[^\n]+\n/g, '');

    // 2. Remove `interface ... { ... }` blocks (multi-line)
    code = code.replace(/\binterface\s+\w[\w\d]*\s*(<[^>]+>)?\s*\{[^}]*\}/gs, '');

    // 3. Remove `type Alias = ...;` declarations
    code = code.replace(/\btype\s+\w[\w\d]*\s*=\s*[^;]+;/g, '');

    // 4. Remove `: TypeAnnotation` (e.g., : string, : any, : number, : UserConfig, : Record<string, any>)
    code = code.replace(/:\s*(?:any|string|number|boolean|object|void|unknown|never|Record|Array|[A-Z]\w*)[A-Za-z0-9_<>,\s\[\]|&\?\.]*(?=[=,\)\s;{])/g, '');

    // 5. Remove `as Type` casts (e.g., as number, as any, as UserConfig)
    code = code.replace(/\bas\s+(?:any|string|number|boolean|object|[A-Z]\w*)/g, '');

    // 6. Normalize TypeScript CJS `export =` syntax
    code = code.replace(/\bexport\s*=\s*/g, 'export default ');
  }

  // CommonJS export normalization to standard ESM default export
  if (!/\bexport\s+default\b/.test(code)) {
    if (/\bmodule\.exports\s*=\s*/.test(code)) {
      code = code.replace(/\bmodule\.exports\s*=\s*/g, 'export default ');
    } else if (/\bexports\.default\s*=\s*/.test(code)) {
      code = code.replace(/\bexports\.default\s*=\s*/g, 'export default ');
    }
  }

  // Inject CJS require support for ESM runtime context if required
  if (/\brequire\s*\(/.test(code) && !/\bcreateRequire\b/.test(code)) {
    code = `import { createRequire as __rayCreateRequire } from 'module';\nconst require = __rayCreateRequire(import.meta.url);\n` + code;
  }

  return code;
}

/**
 * Loads a build configuration file (.js, .ts, .mjs; CommonJS or ESM).
 *
 * @param configPath Absolute or relative path to the configuration file
 * @returns Resolves to the loaded & evaluated configuration object
 */
export async function loadConfig(configPath: string): Promise<Record<string, any>> {
  const absolutePath = path.resolve(configPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Configuration file not found: "${configPath}"`);
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const isTs = ext === '.ts';
  const rawSource = fs.readFileSync(absolutePath, 'utf-8');
  const code = normalizeSourceCode(rawSource, isTs);

  const projectDir = path.dirname(absolutePath);
  const tempOutDir = path.join(projectDir, '.ray');
  const tempOut = path.join(
    tempOutDir,
    `temp-config-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.mjs`
  );

  fs.mkdirSync(tempOutDir, { recursive: true });
  fs.writeFileSync(tempOut, code, 'utf-8');

  try {
    const fileUrl = pathToFileURL(tempOut).toString() + `?t=${Date.now()}`;
    const importedModule = await import(/* @vite-ignore */ fileUrl);

    let rawConfig = importedModule.default !== undefined ? importedModule.default : importedModule;

    // Normalize default export wrapper objects if present
    if (
      rawConfig &&
      typeof rawConfig === 'object' &&
      'default' in rawConfig &&
      Object.keys(rawConfig).length === 1
    ) {
      rawConfig = rawConfig.default;
    }

    /**
     * If the configuration exports a function (e.g., Vite's `defineConfig((env) => ({ ... }))`
     * or Webpack's function config `module.exports = (env, argv) => ({ ... })`), we invoke it
     * with a minimal environment object: { command: "build", mode: "production" }.
     */
    if (typeof rawConfig === 'function') {
      const env: ConfigEnv = { command: 'build', mode: 'production' };
      rawConfig = await rawConfig(env);
    }

    if (rawConfig == null || typeof rawConfig !== 'object') {
      throw new Error(`Configuration exported from "${path.basename(configPath)}" is invalid or not an object.`);
    }

    return rawConfig;
  } finally {
    try {
      if (fs.existsSync(tempOut)) {
        fs.unlinkSync(tempOut);
      }
    } catch {
      // Ignore temporary file cleanup failure
    }
  }
}
