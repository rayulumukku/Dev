# Ray Dependency Graph Inspector (`@ray/graph-inspector`)

The `@ray/graph-inspector` package provides a real-time visual interface for inspecting Ray's module dependency graph, HMR propagation cascades, circular dependency cycles, and plugin performance metrics.

## CLI Usage

Launch the graph inspector web UI:

```bash
npx ray-graph --open --port 4000
```

## Features

- **Live Graph Stream**: Real-time WebSocket/SSE updates as files are added, modified, or deleted.
- **Circular Dependency Detection**: Flags cycle paths (e.g. `A -> B -> C -> A`) with suggested breaking points.
- **HMR Cascade Tracking**: Visualizes file edits and invalidation trees in real time.
- **Plugin Transform Metrics**: Displays execution durations and transform counts per plugin.
