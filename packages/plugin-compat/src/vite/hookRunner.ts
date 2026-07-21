import { RayPlugin } from '@ray/core';

/**
 * Executes the resolveId hook sequentially across plugins, returning the first truthy result.
 */
export async function runResolveId(
  plugins: RayPlugin[],
  id: string,
  importer?: string,
  context?: any
): Promise<string | null> {
  for (const plugin of plugins) {
    if (plugin.resolveId) {
      const res = await plugin.resolveId.call(context, id, importer);
      if (res) return res;
    }
  }
  return null;
}

/**
 * Executes the load hook sequentially across plugins, returning the first truthy result.
 */
export async function runLoad(
  plugins: RayPlugin[],
  id: string,
  context?: any
): Promise<string | null> {
  for (const plugin of plugins) {
    if (plugin.load) {
      const res = await plugin.load.call(context, id);
      if (res) return res;
    }
  }
  return null;
}

/**
 * Executes the transform hook sequentially across plugins, chaining the code outputs.
 */
export async function runTransform(
  plugins: RayPlugin[],
  code: string,
  id: string,
  context?: any
): Promise<{ code: string; map?: any }> {
  let currentCode = code;
  let currentMap: any = null;

  for (const plugin of plugins) {
    if (plugin.transform) {
      const res = await plugin.transform.call(context, currentCode, id);
      if (res) {
        if (typeof res === 'string') {
          currentCode = res;
        } else if (typeof res === 'object') {
          currentCode = res.code;
          if (res.map) currentMap = res.map;
        }
      }
    }
  }

  return { code: currentCode, map: currentMap };
}
