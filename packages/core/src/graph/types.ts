/**
 * Read-only snapshot information for a ModuleNode.
 */
export interface ModuleNodeInfo {
  readonly id: string;
  readonly file: string;
  readonly url: string;
  readonly dependencies: ReadonlySet<string>;
  readonly importers: ReadonlySet<string>;
  readonly lastTransformTime: number;
  readonly isSelfAccepting: boolean;
  readonly status: 'clean' | 'dirty' | 'rebuilding' | 'failed';
  readonly hash: string;
}

/**
 * Information describing a dependency link between modules.
 */
export interface DependencyEdgeInfo {
  readonly from: string;
  readonly to: string;
}

/**
 * Immutable snapshot of the entire DependencyGraph.
 */
export interface GraphSnapshotInfo {
  readonly modules: ReadonlyMap<string, ModuleNodeInfo>;
  readonly size: number;
}

/**
 * Event details describing a graph update operation.
 */
export interface GraphUpdateInfo {
  readonly type: 'register' | 'resolveEdge' | 'invalidate' | 'recompute';
  readonly targetId?: string;
  readonly timestamp: number;
}
