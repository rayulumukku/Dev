# Dependency Graph Lifecycle Events (`@ray/core/graph`)

Ray's Dependency Graph exposes non-intrusive lifecycle hooks allowing plugins to observe module discovery, edge resolution, graph invalidation, and full graph updates without altering graph construction or performance.

## Lifecycle Events

- `onModuleDiscovered(module: ModuleNodeInfo)`: Emitted when a new module node is added to the graph.
- `onDependencyResolved(edge: DependencyEdgeInfo)`: Emitted when an import relationship (`from` -> `to`) is created or updated.
- `onGraphInvalidated(module: ModuleNodeInfo)`: Emitted when a module's compilation cache is invalidated.
- `onGraphUpdated(graph: GraphSnapshotInfo)`: Emitted after dependency graph recomputation.

## Event Timing & Fast-Path Guarantees

- **Lightweight Wrappers**: Event payloads are frozen (`Object.freeze`) read-only snapshots (`ReadonlySet`, `ReadonlyMap`). Internal graph structures are never exposed to plugins for direct mutation.
- **Zero-Plugin Overhead**: When zero plugins register graph lifecycle hooks, notification methods return immediately via fast-path checks (<1% overhead).
- **Sequential Async Execution**: Graph hooks execute sequentially and support asynchronous handler functions without race conditions.
