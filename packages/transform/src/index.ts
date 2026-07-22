import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _req = createRequire(import.meta.url);

/**
 * @ray/transform — Ray Native Transform
 *
 * Previously backed by esbuild. Now delegates entirely to RayCompiler.
 * The public API surface is identical to the old esbuild-backed version.
 */

let _compiler: any = null;

async function getCompiler(): Promise<any> {
  if (_compiler) return _compiler;
  // Resolve RayCompiler from the compiled @ray/core dist output
  const candidates = [
    path.join(__dirname, '../../core/dist/compiler/index.js'),
    path.join(__dirname, '../../../core/dist/compiler/index.js'),
  ];
  let RayCompiler: any = null;
  for (const c of candidates) {
    try {
      const fileUrl = new URL(`file://${c.replace(/\\/g, '/')}`).toString();
      const mod = await import(fileUrl);
      RayCompiler = mod.RayCompiler;
      if (RayCompiler) break;
    } catch { /* next */ }
  }
  if (!RayCompiler) throw new Error('[Ray Transform] Could not load RayCompiler from @ray/core dist');
  _compiler = new RayCompiler({});
  return _compiler;
}

export interface TransformOptions {
  minify?: boolean;
  plugins?: any[];
  pluginContainer?: any;
}

async function runPluginTransforms(code: string, filename: string, options?: TransformOptions): Promise<string> {
  if (options?.pluginContainer && typeof options.pluginContainer.transform === 'function') {
    const res = await options.pluginContainer.transform(code, filename);
    return res?.code ?? code;
  }
  if (options?.plugins && Array.isArray(options.plugins) && options.plugins.length > 0) {
    let currentCode = code;
    for (const plugin of options.plugins) {
      if (typeof plugin.transform === 'function') {
        const res = await plugin.transform(currentCode, filename);
        if (res) {
          currentCode = typeof res === 'string' ? res : (res.code ?? currentCode);
        }
      }
    }
    return currentCode;
  }
  return code;
}

/**
 * Transforms JS/JSX/TS/TSX code using Ray's native compiler.
 * Supports plugin transform hooks prior to core compilation.
 */
export async function transformJsx(code: string, filename: string, options?: TransformOptions): Promise<string> {
  try {
    const codeAfterPlugins = await runPluginTransforms(code, filename, options);
    const compiler = await getCompiler();
    const result = compiler.compile(codeAfterPlugins, filename);
    return result.code;
  } catch (err: any) {
    console.warn(`[Ray Transform] Compile failed for ${path.basename(filename)}: ${err.message}`);
    return code;
  }
}

/**
 * Async compile with full { code, map } output.
 * Supports plugin transform hooks prior to core compilation.
 */
export async function transformFile(
  code: string,
  filename: string,
  options: TransformOptions = {}
): Promise<{ code: string; map?: string }> {
  try {
    const codeAfterPlugins = await runPluginTransforms(code, filename, options);
    const compiler = await getCompiler();
    const result = compiler.compile(codeAfterPlugins, filename, options);
    return {
      code: result.code,
      map: typeof result.map === 'string' ? result.map : JSON.stringify(result.map),
    };
  } catch (err: any) {
    console.warn(`[Ray Transform] Compile failed for ${path.basename(filename)}: ${err.message}`);
    return { code };
  }
}

