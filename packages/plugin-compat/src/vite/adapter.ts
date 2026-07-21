import { RayPlugin, PluginContext } from '@ray/core';
import { CompatiblePlugin } from './types.js';
import { VitePluginContext } from './context.js';
import fs from 'fs/promises';

/**
 * Adapts a standard Vite plugin into a Ray-compatible plugin.
 * Implements lifecycle hooks mapping and bubbles errors safely.
 */
export function adaptVitePlugin(vitePlugin: CompatiblePlugin): RayPlugin {
  const name = vitePlugin.name;

  return {
    name,
    enforce: vitePlugin.enforce,

    async resolveId(this: PluginContext, id, importer) {
      if (!vitePlugin.resolveId) return null;

      const command = this.buildMode === 'production' ? 'build' : 'serve';
      const ctx = new VitePluginContext(this, command);

      try {
        const res = await vitePlugin.resolveId.call(ctx as any, id, importer, { isEntry: false });
        if (!res) return null;
        if (typeof res === 'string') return res;
        if (typeof res === 'object' && res !== null) return res.id || null;
        return null;
      } catch (err: any) {
        throw new Error(`[Plugin: ${name}] resolveId error: ${err.message || String(err)}`);
      }
    },

    async load(this: PluginContext, id) {
      if (!vitePlugin.load) return null;

      const command = this.buildMode === 'production' ? 'build' : 'serve';
      const ctx = new VitePluginContext(this, command);

      try {
        const res = await vitePlugin.load.call(ctx as any, id);
        if (!res) return null;
        if (typeof res === 'string') return res;
        if (typeof res === 'object' && res !== null) return res.code || null;
        return null;
      } catch (err: any) {
        throw new Error(`[Plugin: ${name}] load error: ${err.message || String(err)}`);
      }
    },

    async transform(this: PluginContext, code, id) {
      if (!vitePlugin.transform) return null;

      const command = this.buildMode === 'production' ? 'build' : 'serve';
      const ctx = new VitePluginContext(this, command);

      try {
        const res = await vitePlugin.transform.call(ctx as any, code, id);
        if (!res) return null;
        if (typeof res === 'string') {
          return { code: res };
        }
        if (typeof res === 'object' && res !== null) {
          return {
            code: res.code,
            map: res.map
          };
        }
        return null;
      } catch (err: any) {
        throw new Error(`[Plugin: ${name}] transform error: ${err.message || String(err)}`);
      }
    },

    async handleHotUpdate(this: PluginContext, ctx: { file: string; timestamp: number }) {
      if (!vitePlugin.handleHotUpdate) return;

      const command = this.buildMode === 'production' ? 'build' : 'serve';
      const viteCtx = new VitePluginContext(this, command);

      const node = this.graph.getModule(ctx.file);
      const modules = node ? [node] : [];

      const hmrContext = {
        file: ctx.file,
        timestamp: ctx.timestamp,
        modules,
        read: async () => {
          return await fs.readFile(ctx.file, 'utf-8');
        },
        server: {
          config: {
            root: this.projectRoot,
            mode: this.buildMode
          }
        }
      };

      try {
        await vitePlugin.handleHotUpdate.call(viteCtx as any, hmrContext);
      } catch (err: any) {
        throw new Error(`[Plugin: ${name}] handleHotUpdate error: ${err.message || String(err)}`);
      }
    }
  };
}
