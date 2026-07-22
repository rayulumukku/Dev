import { ModuleNode } from './moduleNode.js';
import { DependencyGraph } from './index.js';
import { ModuleNodeInfo, DependencyEdgeInfo, GraphSnapshotInfo } from './types.js';

export function createModuleSnapshot(node: ModuleNode): ModuleNodeInfo {
  return Object.freeze({
    id: node.id,
    file: node.file,
    url: node.url,
    dependencies: Object.freeze(new Set(Array.from(node.dependencies).map((d) => d.id))),
    importers: Object.freeze(new Set(Array.from(node.importers).map((i) => i.id))),
    lastTransformTime: node.lastTransformTime,
    isSelfAccepting: node.isSelfAccepting,
    status: node.status,
    hash: node.hash,
  });
}

export function createDependencyEdgeInfo(fromId: string, toId: string): DependencyEdgeInfo {
  return Object.freeze({
    from: fromId,
    to: toId,
  });
}

export function createGraphSnapshot(graph: DependencyGraph): GraphSnapshotInfo {
  const map = new Map<string, ModuleNodeInfo>();
  for (const [id, node] of graph.modules.entries()) {
    map.set(id, createModuleSnapshot(node));
  }
  return Object.freeze({
    modules: Object.freeze(map),
    size: map.size,
  });
}
