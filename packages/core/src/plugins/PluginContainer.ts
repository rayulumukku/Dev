import { RayPlugin } from './Plugin.js';
import { PluginContext, PluginContextOptions } from './PluginContext.js';
import {
  runResolveId,
  runLoad,
  runBeforeTransform,
  runTransform,
  runAfterTransform,
  runModuleDiscovered,
  runDependencyResolved,
  runGraphInvalidated,
  runGraphUpdated,
} from './HookRunner.js';
import { ModuleNodeInfo, DependencyEdgeInfo, GraphSnapshotInfo } from '../graph/types.js';

export class PluginContainer {
  private plugins: RayPlugin[] = [];
  private context: PluginContext;

  private hasBeforeTransform = false;
  private hasTransform = false;
  private hasAfterTransform = false;

  private hasModuleDiscovered = false;
  private hasDependencyResolved = false;
  private hasGraphInvalidated = false;
  private hasGraphUpdated = false;

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
    this.updateHookFlags();
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

  private updateHookFlags(): void {
    this.hasBeforeTransform = this.plugins.some((p) => typeof p.beforeTransform === 'function');
    this.hasTransform = this.plugins.some((p) => typeof p.transform === 'function');
    this.hasAfterTransform = this.plugins.some((p) => typeof p.afterTransform === 'function');

    this.hasModuleDiscovered = this.plugins.some((p) => typeof p.onModuleDiscovered === 'function');
    this.hasDependencyResolved = this.plugins.some((p) => typeof p.onDependencyResolved === 'function');
    this.hasGraphInvalidated = this.plugins.some((p) => typeof p.onGraphInvalidated === 'function');
    this.hasGraphUpdated = this.plugins.some((p) => typeof p.onGraphUpdated === 'function');
  }

  getPlugins(): RayPlugin[] {
    return [...this.plugins];
  }

  getContext(): PluginContext {
    return this.context;
  }

  hasTransformHooks(): boolean {
    return this.hasBeforeTransform || this.hasTransform || this.hasAfterTransform;
  }

  async resolveId(id: string, importer?: string): Promise<string | null> {
    return runResolveId(this.plugins, id, importer, this.context);
  }

  async load(id: string): Promise<string | null> {
    return runLoad(this.plugins, id, this.context);
  }

  async beforeTransform(transformContext: any): Promise<void> {
    if (!this.hasBeforeTransform) return;
    return runBeforeTransform(this.plugins, transformContext, this.context);
  }

  async transform(code: string, id: string, transformContext?: any): Promise<{ code: string; map?: any }> {
    return runTransform(this.plugins, code, id, this.context, transformContext);
  }

  async afterTransform(result: { code: string; map?: any }, transformContext: any): Promise<{ code: string; map?: any }> {
    if (!this.hasAfterTransform) return result;
    return runAfterTransform(this.plugins, result, transformContext, this.context);
  }

  // Graph Lifecycle Methods (PR-06)

  async onModuleDiscovered(module: ModuleNodeInfo): Promise<void> {
    if (!this.hasModuleDiscovered) return;
    return runModuleDiscovered(this.plugins, module, this.context);
  }

  async onDependencyResolved(edge: DependencyEdgeInfo): Promise<void> {
    if (!this.hasDependencyResolved) return;
    return runDependencyResolved(this.plugins, edge, this.context);
  }

  async onGraphInvalidated(module: ModuleNodeInfo): Promise<void> {
    if (!this.hasGraphInvalidated) return;
    return runGraphInvalidated(this.plugins, module, this.context);
  }

  async onGraphUpdated(graph: GraphSnapshotInfo): Promise<void> {
    if (!this.hasGraphUpdated) return;
    return runGraphUpdated(this.plugins, graph, this.context);
  }
}
