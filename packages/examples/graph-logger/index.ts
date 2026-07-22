import { ModuleNodeInfo, DependencyEdgeInfo, GraphSnapshotInfo } from '@ray/core';

export interface GraphLoggerOptions {
  prefix?: string;
}

export function graphLoggerPlugin(options: GraphLoggerOptions = {}): any {
  const prefix = options.prefix || '[Graph Logger]';

  return {
    name: 'graph-logger-plugin',

    onModuleDiscovered(module: ModuleNodeInfo) {
      console.log(`${prefix} New Module: ${module.id} (${module.url})`);
    },

    onDependencyResolved(edge: DependencyEdgeInfo) {
      console.log(`${prefix} Resolved: ${edge.from} -> ${edge.to}`);
    },

    onGraphInvalidated(module: ModuleNodeInfo) {
      console.log(`${prefix} Invalidated: ${module.id}`);
    },

    onGraphUpdated(graph: GraphSnapshotInfo) {
      console.log(`${prefix} Graph Updated: ${graph.size} modules total`);
    },
  };
}
