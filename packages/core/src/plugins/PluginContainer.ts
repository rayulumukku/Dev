import { RayPlugin } from './Plugin.js';
import { PluginContext, PluginContextOptions } from './PluginContext.js';
import { runResolveId, runLoad, runTransform } from './HookRunner.js';

export class PluginContainer {
  private plugins: RayPlugin[] = [];
  private context: PluginContext;

  constructor(plugins: RayPlugin[] = [], contextOptions?: Partial<PluginContextOptions>) {
    this.context = new PluginContext({
      root: contextOptions?.root || process.cwd(),
      command: contextOptions?.command || 'serve',
      mode: contextOptions?.mode,
      resolver: contextOptions?.resolver,
      onWarn: contextOptions?.onWarn,
      onError: contextOptions?.onError,
    });

    for (const plugin of plugins) {
      this.register(plugin);
    }
  }

  register(plugin: RayPlugin): void {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Plugin must be an object');
    }
    if (!plugin.name || typeof plugin.name !== 'string' || plugin.name.trim() === '') {
      throw new Error('Plugin must have a valid name property');
    }
    this.plugins.push(plugin);
    this.sortPlugins();
  }

  private sortPlugins(): void {
    const pre: RayPlugin[] = [];
    const normal: RayPlugin[] = [];
    const post: RayPlugin[] = [];

    for (const p of this.plugins) {
      if (p.enforce === 'pre') {
        pre.push(p);
      } else if (p.enforce === 'post') {
        post.push(p);
      } else {
        normal.push(p);
      }
    }

    this.plugins = [...pre, ...normal, ...post];
  }

  getPlugins(): RayPlugin[] {
    return [...this.plugins];
  }

  getContext(): PluginContext {
    return this.context;
  }

  async resolveId(id: string, importer?: string): Promise<string | null> {
    return runResolveId(this.plugins, id, importer, this.context);
  }

  async load(id: string): Promise<string | null> {
    return runLoad(this.plugins, id, this.context);
  }

  async transform(code: string, id: string): Promise<{ code: string; map?: any }> {
    return runTransform(this.plugins, code, id, this.context);
  }
}
