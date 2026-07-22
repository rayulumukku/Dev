# Build Observability & Telemetry Framework (`@ray/observability`)

The `@ray/observability` package provides a privacy-first, local-only build telemetry and tracing layer for Ray, recording build phase spans, plugin execution timings, memory RSS usage, cache hit ratios, and Chrome Trace Event exports (`chrome://tracing`).

## Privacy & Security Guarantees

- **Disabled by Default**: Observability is opt-in (`observability.enabled = true`).
- **Local-Only**: Telemetry metrics and trace spans are never uploaded to any remote server automatically.
- **Zero Overhead**: When disabled, event bus calls incur zero operational overhead.

## Architecture

1. **EventBus**: High-performance event emitter broadcasting build lifecycle events.
2. **Span & TraceCollector**: Hierarchical tracing recorder managing parent/child spans (`startSpan`, `endSpan`).
3. **MetricsCollector**: Metrics accumulator tracking transform durations, memory usage, and cache hit ratios.
4. **Session**: Generates and manages unique session identifiers for event correlation.
5. **Exporter**: Serializes recorded traces to JSON or Chrome Trace Event format (`chrome-trace`).

## CLI Usage

```bash
# Display JSON build telemetry
ray observe

# Stream live telemetry spans
ray observe --live

# Export Chrome Trace Event format for Speedscope / chrome://tracing
ray observe --export chrome-trace
```

## Configuration

Enable observability in `ray.config.ts`:

```typescript
import { defineConfig } from '@ray/core';

export default defineConfig({
  observability: {
    enabled: true,
    recordTimings: true,
    recordMemory: true,
    recordCache: true,
    exporter: 'json',
  },
});
```
