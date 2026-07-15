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

function getCompiler(): any {
  if (_compiler) return _compiler;
  // Resolve RayCompiler from the compiled @ray/core dist output
  const candidates = [
    path.join(__dirname, '../../core/dist/compiler/index.js'),
    path.join(__dirname, '../../../core/dist/compiler/index.js'),
  ];
  let RayCompiler: any = null;
  for (const c of candidates) {
    try {
      const mod = _req(c);
      RayCompiler = mod.RayCompiler;
      if (RayCompiler) break;
    } catch { /* next */ }
  }
  if (!RayCompiler) throw new Error('[Ray Transform] Could not load RayCompiler from @ray/core dist');
  _compiler = new RayCompiler({});
  return _compiler;
}

/**
 * Transforms JS/JSX/TS/TSX code using Ray's native compiler.
 * Drop-in replacement for the previous esbuild-based transformJsx().
 */
export async function transformJsx(code: string, filename: string): Promise<string> {
  try {
    const compiler = getCompiler();
    const result = compiler.compile(code, filename);
    return result.code;
  } catch (err: any) {
    console.warn(`[Ray Transform] Compile failed for ${path.basename(filename)}: ${err.message}`);
    return code;
  }
}

/**
 * Async compile with full { code, map } output.
 */
export async function transformFile(
  code: string,
  filename: string,
  options: { minify?: boolean } = {}
): Promise<{ code: string; map?: string }> {
  try {
    const compiler = getCompiler();
    const result = compiler.compile(code, filename, options);
    return {
      code: result.code,
      map: typeof result.map === 'string' ? result.map : JSON.stringify(result.map),
    };
  } catch (err: any) {
    console.warn(`[Ray Transform] Compile failed for ${path.basename(filename)}: ${err.message}`);
    return { code };
  }
}
