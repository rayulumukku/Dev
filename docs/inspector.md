# Ray Developer Inspector and Debug Console (`@ray/inspector`)

The `@ray/inspector` package provides a live developer inspector that exposes Ray's internal development state, visualizing the module graph, dependency graph, transform pipeline, plugin execution, cache activity, HMR updates, task execution, and diagnostics.

## Features

- **Module & Dependency Graph View**: Visualize internal build nodes and edges.
- **Plugin Execution & Transform Pipeline**: Inspect plugin hook timings and source transformations.
- **Cache Statistics**: Monitor persistent and remote compiler cache hit/miss rates.
- **Task Runner View**: Inspect workspace project graph task execution pipelines.
- **WebSocket Event Streaming**: Real-time push updates over WebSocket (no polling).
- **Custom Inspector Panels**: Plugins can register panels via `registerInspectorPanel()`.

## CLI Usage

```bash
# Launch live inspector server on default port 4050
ray inspect

# Launch inspector and automatically open browser
ray inspect --open

# Launch inspector on custom port/host
ray inspect --port 4000 --host 127.0.0.1
```

## Security Considerations

- Binds strictly to `127.0.0.1` (localhost) by default.
- Does not expose file contents outside the active workspace directory.
