import { RayPlugin } from './Plugin.js';
import { PluginContext } from './PluginContext.js';
import { ModuleNodeInfo, DependencyEdgeInfo, GraphSnapshotInfo } from '../graph/types.js';

export async function runResolveId(
  plugins: RayPlugin[],
  id: string,
  importer?: string,
  context?: PluginContext
): Promise<string | null> {
  for (const plugin of plugins) {
    if (plugin.resolveId) {
      try {
        const res = await plugin.resolveId.call(context as PluginContext, id, importer);
        if (res !== null && res !== undefined) {
          return typeof res === 'string' ? res : null;
        }
      } catch (err: any) {
        throw new Error(`[Plugin: ${plugin.name}] resolveId error: ${err.message || String(err)}`);
      }
    }
  }
  return null;
}

export async function runLoad(
  plugins: RayPlugin[],
  id: string,
  context?: PluginContext
): Promise<string | null> {
  for (const plugin of plugins) {
    if (plugin.load) {
      try {
        const res = await plugin.load.call(context as PluginContext, id);
        if (res !== null && res !== undefined) {
          return typeof res === 'string' ? res : null;
        }
      } catch (err: any) {
        throw new Error(`[Plugin: ${plugin.name}] load error: ${err.message || String(err)}`);
      }
    }
  }
  return null;
}

export async function runTransform(
  plugins: RayPlugin[],
  code: string,
  id: string,
  context?: PluginContext
): Promise<{ code: string; map?: any }> {
  let currentCode = code;
  let currentMap: any = undefined;

  for (const plugin of plugins) {
    if (plugin.transform) {
      try {
        const res = await plugin.transform.call(context as PluginContext, currentCode, id);
        if (res !== null && res !== undefined) {
          if (typeof res === 'string') {
            currentCode = res;
          } else if (typeof res === 'object') {
            if (res.code !== undefined) {
              currentCode = res.code;
            }
            if (res.map !== undefined) {
              currentMap = res.map;
            }
          }
        }
      } catch (err: any) {
        throw new Error(`[Plugin: ${plugin.name}] transform error: ${err.message || String(err)}`);
      }
    }
  }

  return { code: currentCode, map: currentMap };
}

export async function runModuleDiscovered(
  plugins: RayPlugin[],
  module: ModuleNodeInfo,
  context?: PluginContext
): Promise<void> {
  for (const plugin of plugins) {
    if (plugin.onModuleDiscovered) {
      try {
        await plugin.onModuleDiscovered.call(context as PluginContext, module);
      } catch (err: any) {
        throw new Error(`[Plugin: ${plugin.name}] onModuleDiscovered error: ${err.message || String(err)}`);
      }
    }
  }
}

export async function runDependencyResolved(
  plugins: RayPlugin[],
  edge: DependencyEdgeInfo,
  context?: PluginContext
): Promise<void> {
  for (const plugin of plugins) {
    if (plugin.onDependencyResolved) {
      try {
        await plugin.onDependencyResolved.call(context as PluginContext, edge);
      } catch (err: any) {
        throw new Error(`[Plugin: ${plugin.name}] onDependencyResolved error: ${err.message || String(err)}`);
      }
    }
  }
}

export async function runGraphInvalidated(
  plugins: RayPlugin[],
  module: ModuleNodeInfo,
  context?: PluginContext
): Promise<void> {
  for (const plugin of plugins) {
    if (plugin.onGraphInvalidated) {
      try {
        await plugin.onGraphInvalidated.call(context as PluginContext, module);
      } catch (err: any) {
        throw new Error(`[Plugin: ${plugin.name}] onGraphInvalidated error: ${err.message || String(err)}`);
      }
    }
  }
}

export async function runGraphUpdated(
  plugins: RayPlugin[],
  graph: GraphSnapshotInfo,
  context?: PluginContext
): Promise<void> {
  for (const plugin of plugins) {
    if (plugin.onGraphUpdated) {
      try {
        await plugin.onGraphUpdated.call(context as PluginContext, graph);
      } catch (err: any) {
        throw new Error(`[Plugin: ${plugin.name}] onGraphUpdated error: ${err.message || String(err)}`);
      }
    }
  }
}
