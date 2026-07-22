import { PluginContext } from './PluginContext.js';
import { ModuleNodeInfo, DependencyEdgeInfo, GraphSnapshotInfo } from '../graph/types.js';

export interface RayPlugin {
  name: string;
  enforce?: 'pre' | 'post';

  resolveId?(
    this: PluginContext,
    id: string,
    importer?: string
  ): Promise<string | null> | string | null;

  load?(
    this: PluginContext,
    id: string
  ): Promise<string | null> | string | null;

  // Transform Pipeline Lifecycle Hooks (PR-07)
  beforeTransform?(this: PluginContext, context: any): Promise<void> | void;

  transform?(
    this: PluginContext,
    code: string,
    id: string,
    context?: any
  ): Promise<{ code: string; map?: any } | string | null> | { code: string; map?: any } | string | null;

  afterTransform?(
    this: PluginContext,
    result: { code: string; map?: any },
    context: any
  ): Promise<{ code: string; map?: any } | void> | { code: string; map?: any } | void;

  // Graph Lifecycle Hooks (PR-06)
  onModuleDiscovered?(this: PluginContext, module: ModuleNodeInfo): Promise<void> | void;
  onDependencyResolved?(this: PluginContext, edge: DependencyEdgeInfo): Promise<void> | void;
  onGraphInvalidated?(this: PluginContext, module: ModuleNodeInfo): Promise<void> | void;
  onGraphUpdated?(this: PluginContext, graph: GraphSnapshotInfo): Promise<void> | void;
}
