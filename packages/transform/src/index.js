import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { createTransformContext } from './TransformContext.js';

export * from './TransformContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _req = createRequire(import.meta.url);

let _compiler = null;

async function getCompiler() {
  if (_compiler) return _compiler;
  const candidates = [
    path.join(__dirname, '../../core/dist/compiler/index.js'),
    path.join(__dirname, '../../../core/dist/compiler/index.js'),
  ];
  let RayCompiler = null;
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

async function runFullTransformPipeline(code, filename, options = {}) {
  const container = options.pluginContainer;
  const plugins = options.plugins;

  const hasContainerHooks = container && typeof container.hasTransformHooks === 'function' && container.hasTransformHooks();
  const hasPluginsList = Array.isArray(plugins) && plugins.length > 0;

  const compiler = await getCompiler();

  // Fast path: Zero plugins registered
  if (!hasContainerHooks && !hasPluginsList) {
    const res = compiler.compile(code, filename, options);
    return {
      code: res.code,
      map: res.map,
    };
  }

  const transformCtx = createTransformContext({
    filename,
    root: options.root,
    mode: options.mode,
    command: options.command,
    loader: options.loader,
    sourcemap: options.sourcemap,
  });

  let currentCode = code;
  let currentMap = undefined;

  // 1. beforeTransform stage
  if (container && typeof container.beforeTransform === 'function') {
    await container.beforeTransform(transformCtx);
  } else if (hasPluginsList) {
    for (const plugin of plugins) {
      if (typeof plugin.beforeTransform === 'function') {
        try {
          await plugin.beforeTransform(transformCtx);
        } catch (err) {
          throw new Error(`[Plugin: ${plugin.name}] beforeTransform error in ${filename}: ${err.message || String(err)}`);
        }
      }
    }
  }

  // 2. transform stage
  if (container && typeof container.transform === 'function') {
    const res = await container.transform(currentCode, filename, transformCtx);
    if (res) {
      currentCode = res.code ?? currentCode;
      if (res.map !== undefined) currentMap = res.map;
    }
  } else if (hasPluginsList) {
    for (const plugin of plugins) {
      if (typeof plugin.transform === 'function') {
        try {
          const res = await plugin.transform(currentCode, filename, transformCtx);
          if (res !== null && res !== undefined) {
            if (typeof res === 'string') {
              currentCode = res;
            } else if (typeof res === 'object') {
              if (res.code !== undefined) currentCode = res.code;
              if (res.map !== undefined) currentMap = res.map;
            }
          }
        } catch (err) {
          throw new Error(`[Plugin: ${plugin.name}] transform error in ${filename}: ${err.message || String(err)}`);
        }
      }
    }
  }

  // 3. Existing compiler compilation
  const compiledRes = compiler.compile(currentCode, filename, options);
  let finalCode = compiledRes.code;
  let finalMap = compiledRes.map || currentMap;

  // 4. afterTransform stage
  let stageResult = { code: finalCode, map: finalMap };

  if (container && typeof container.afterTransform === 'function') {
    const afterRes = await container.afterTransform(stageResult, transformCtx);
    if (afterRes && typeof afterRes === 'object' && afterRes.code !== undefined) {
      stageResult = {
        code: afterRes.code,
        map: afterRes.map !== undefined ? afterRes.map : stageResult.map,
      };
    }
  } else if (hasPluginsList) {
    for (const plugin of plugins) {
      if (typeof plugin.afterTransform === 'function') {
        try {
          const afterRes = await plugin.afterTransform(stageResult, transformCtx);
          if (afterRes && typeof afterRes === 'object' && afterRes.code !== undefined) {
            stageResult = {
              code: afterRes.code,
              map: afterRes.map !== undefined ? afterRes.map : stageResult.map,
            };
          }
        } catch (err) {
          throw new Error(`[Plugin: ${plugin.name}] afterTransform error in ${filename}: ${err.message || String(err)}`);
        }
      }
    }
  }

  return stageResult;
}

export async function transformJsx(code, filename, options) {
  try {
    const res = await runFullTransformPipeline(code, filename, options);
    return res.code;
  } catch (err) {
    if (err.message && err.message.startsWith('[Plugin:')) {
      throw err;
    }
    console.warn(`[Ray Transform] Compile failed for ${path.basename(filename)}: ${err.message}`);
    return code;
  }
}

export async function transformFile(code, filename, options = {}) {
  try {
    const res = await runFullTransformPipeline(code, filename, options);
    return {
      code: res.code,
      map: typeof res.map === 'string' ? res.map : res.map ? JSON.stringify(res.map) : undefined,
    };
  } catch (err) {
    if (err.message && err.message.startsWith('[Plugin:')) {
      throw err;
    }
    console.warn(`[Ray Transform] Compile failed for ${path.basename(filename)}: ${err.message}`);
    return { code };
  }
}