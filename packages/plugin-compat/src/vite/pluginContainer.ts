import { RayPlugin } from '@ray/core';
import { runResolveId, runLoad, runTransform } from './hookRunner.js';

/**
 * Compatibility container wrapping a list of adapted plugins
 * to execute standard lifecycle hooks.
 */
export class VitePluginContainer {
  private plugins: RayPlugin[];
  private context: any;

  constructor(plugins: RayPlugin[], context: any) {
    this.plugins = plugins;
    this.context = context;
  }

  async resolveId(id: string, importer?: string): Promise<string | null> {
    return await runResolveId(this.plugins, id, importer, this.context);
  }

  async load(id: string): Promise<string | null> {
    return await runLoad(this.plugins, id, this.context);
  }

  async transform(code: string, id: string): Promise<{ code: string; map?: any }> {
    return await runTransform(this.plugins, code, id, this.context);
  }
}
