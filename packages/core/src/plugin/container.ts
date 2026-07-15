import { RayPlugin, PluginContext } from './index.js';

export class PluginContainer {
  plugins: RayPlugin[] = [];
  context: PluginContext;
  /** Active execution time accumulator per plugin (in ms) */
  metrics: Map<string, number> = new Map();
  /** Mapped hooks per plugin name */
  hooksMap: Map<string, string[]> = new Map();
  /** Map tracking intermediate compile stages code by filename key */
  transformStages: Map<string, Array<{ pluginName: string; code: string }>> = new Map();

  constructor(plugins: RayPlugin[], context: PluginContext) {
    const pre = plugins.filter((p) => p.enforce === 'pre');
    const normal = plugins.filter((p) => !p.enforce);
    const post = plugins.filter((p) => p.enforce === 'post');
    this.plugins = [...pre, ...normal, ...post];
    this.context = context;

    for (const plugin of this.plugins) {
      const hooks: string[] = [];
      const keys = Object.keys(plugin) as Array<keyof RayPlugin>;
      for (const k of keys) {
        if (k !== 'name' && k !== 'enforce' && typeof (plugin as any)[k] === 'function') {
          hooks.push(k);
        }
      }
      this.hooksMap.set(plugin.name, hooks);
      this.metrics.set(plugin.name, 0);
    }
  }

  private async runHook<T>(plugin: RayPlugin, hookName: string, fn: () => Promise<T> | T): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      const prev = this.metrics.get(plugin.name) || 0;
      this.metrics.set(plugin.name, prev + duration);
    }
  }

  private getPluginContext(plugin: RayPlugin): PluginContext {
    return {
      ...this.context,
      cache: {
        get: (key: string) => {
          const store = (this.context as any).cacheStore || (globalThis as any).__ray_cache_store;
          return store ? store.getPluginCache(plugin.name)[key] : undefined;
        },
        set: (key: string, val: any) => {
          const store = (this.context as any).cacheStore || (globalThis as any).__ray_cache_store;
          if (store) {
            store.getPluginCache(plugin.name)[key] = val;
            store.save();
          }
        },
        invalidate: (key: string) => {
          const store = (this.context as any).cacheStore || (globalThis as any).__ray_cache_store;
          if (store) {
            delete store.getPluginCache(plugin.name)[key];
            store.save();
          }
        }
      }
    };
  }

  async resolveId(id: string, importer?: string): Promise<string | null> {
    for (const plugin of this.plugins) {
      if (plugin.resolveId) {
        const resolved = await this.runHook(plugin, 'resolveId', () =>
          plugin.resolveId!.call(this.getPluginContext(plugin), id, importer)
        );
        if (resolved !== null) {
          return resolved;
        }
      }
    }
    return null;
  }

  async load(id: string): Promise<string | null> {
    for (const plugin of this.plugins) {
      if (plugin.load) {
        const loaded = await this.runHook(plugin, 'load', () =>
          plugin.load!.call(this.getPluginContext(plugin), id)
        );
        if (loaded !== null) {
          return loaded;
        }
      }
    }
    return null;
  }

  async transform(code: string, id: string): Promise<{ code: string; map?: any }> {
    let currentCode = code;
    let currentMap = undefined;

    const stages: Array<{ pluginName: string; code: string }> = [
      { pluginName: 'Source', code: currentCode }
    ];
    this.transformStages.set(id, stages);

    for (const plugin of this.plugins) {
      if (plugin.transform) {
        const result = await this.runHook(plugin, 'transform', () =>
          plugin.transform!.call(this.getPluginContext(plugin), currentCode, id)
        );
        if (result !== null && result !== undefined) {
          if (typeof result === 'string') {
            currentCode = result;
          } else {
            currentCode = result.code;
            if (result.map) currentMap = result.map;
          }
          stages.push({ pluginName: plugin.name, code: currentCode });
        }
      }
    }

    return { code: currentCode, map: currentMap };
  }

  async handleHotUpdate(ctx: { file: string; timestamp: number }): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.handleHotUpdate) {
        await this.runHook(plugin, 'handleHotUpdate', () =>
          plugin.handleHotUpdate!.call(this.getPluginContext(plugin), ctx)
        );
      }
    }
  }

  async buildStart(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.buildStart) {
        await this.runHook(plugin, 'buildStart', () =>
          plugin.buildStart!.call(this.getPluginContext(plugin))
        );
      }
    }
  }

  async buildEnd(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.buildEnd) {
        await this.runHook(plugin, 'buildEnd', () =>
          plugin.buildEnd!.call(this.getPluginContext(plugin))
        );
      }
    }
  }

  async generateBundle(bundle: any): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.generateBundle) {
        await this.runHook(plugin, 'generateBundle', () =>
          plugin.generateBundle!.call(this.getPluginContext(plugin), bundle)
        );
      }
    }
  }

  async closeBundle(): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.closeBundle) {
        await this.runHook(plugin, 'closeBundle', () =>
          plugin.closeBundle!.call(this.getPluginContext(plugin))
        );
      }
    }
  }
}
