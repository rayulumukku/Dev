import { PluginMeta } from './types.js';
import { PluginVersion } from './Version.js';

export interface RayPluginDefinition extends PluginMeta {
  name: string;
  enforce?: 'pre' | 'post';
  config?: (config: any) => void | Promise<void>;
  configResolved?: (config: any) => void | Promise<void>;
  resolveId?: any;
  load?: any;
  beforeTransform?: any;
  transform?: any;
  afterTransform?: any;
  handleHotUpdate?: any;
  buildStart?: any;
  buildEnd?: any;
  generateBundle?: any;
  closeBundle?: any;
  onModuleDiscovered?: any;
  onDependencyResolved?: any;
  onGraphInvalidated?: any;
  onGraphUpdated?: any;
}

export function definePlugin<T = any>(
  factory: (options?: T) => RayPluginDefinition | RayPluginDefinition
): (options?: T) => RayPluginDefinition {
  return (options?: T) => {
    const plugin = typeof factory === 'function' ? factory(options) : factory;

    if (!plugin.name) {
      throw new Error('[Ray SDK] Plugin must specify a unique "name" property.');
    }

    if (plugin.compatibility) {
      const compat = PluginVersion.checkCompatibility(plugin.compatibility);
      if (!compat.ok) {
        console.warn(`[Ray SDK Warning] ${plugin.name}: ${compat.reason}`);
      }
    }

    return plugin;
  };
}
