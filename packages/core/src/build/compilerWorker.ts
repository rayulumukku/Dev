import { parentPort } from 'worker_threads';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Compiler Worker — Ray Native Transform
 *
 * Replaces esbuild.transform entirely. Uses RayCompiler from the core compiler
 * package, running inside a worker_thread to enable true parallelism.
 *
 * Input message: { code: string, file: string, options: { minify?: boolean, define?: Record<string,string> } }
 * Output message: { success: boolean, code: string, map: string } | { success: false, error: string }
 */

const req = createRequire(import.meta.url);

/**
 * Lazily resolve RayCompiler from the dist output (works both in development
 * and production since the worker is always executed from the compiled dist/).
 */
function loadRayCompiler(): any {
  // Try to load from compiled dist
  const candidates = [
    path.join(__dirname, '../compiler/index.js'),
    path.join(__dirname, '../../core/dist/compiler/index.js'),
  ];
  for (const candidate of candidates) {
    try {
      return req(candidate);
    } catch { /* try next */ }
  }
  return null;
}

const compilerModule = loadRayCompiler();

if (parentPort) {
  parentPort.on('message', async (message: {
    code: string;
    file: string;
    options?: { minify?: boolean; define?: Record<string, string> };
  }) => {
    const { code, file, options = {} } = message;

    try {
      if (!compilerModule) {
        throw new Error('[Ray Worker] Could not resolve RayCompiler module');
      }

      const { RayCompiler } = compilerModule;
      const define = options.define || {};
      const compiler = new RayCompiler(define);

      const result = compiler.compile(code, file, { minify: options.minify ?? false });

      parentPort!.postMessage({
        success: true,
        code: result.code,
        map: typeof result.map === 'string' ? result.map : JSON.stringify(result.map),
      });
    } catch (err: any) {
      parentPort!.postMessage({
        success: false,
        error: err.message ?? String(err),
      });
    }
  });
}
