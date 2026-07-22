# Project Graph & Task Orchestration Engine (`@ray/project-graph`)

The `@ray/project-graph` package provides workspace project scanning, inter-project dependency graph management, task pipeline scheduling, cache reuse, affected project computation, and execution reporting.

## Architecture

1. **ProjectScanner**: Automatically scans workspace directories (`packages/*`, `apps/*`, `libs/*`, `examples/*`, `tools/*`) and workspace configurations (`package.json`, `pnpm-workspace.yaml`).
2. **DependencyAnalyzer**: Analyzes inter-project dependency edges from package metadata.
3. **ProjectGraph**: Central graph data structure managing project nodes, topological sorting, and graph queries.
4. **TaskScheduler & TaskPipeline**: Dependency-aware topological task scheduler supporting parallel execution and configurable concurrency.
5. **TaskCache**: Checks task SHA-256 execution hashes against local cache store to reuse outputs.
6. **TaskRunner**: Task execution runner handling task cancellation, plugin hooks (`beforeTask`, `afterTask`), and execution reporting.
7. **AffectedProjects**: Computes downstream affected projects based on source file changes and dependency graph edges.

## CLI Commands

```bash
# Display project dependency graph
ray graph

# Execute task across workspace
ray task build

# Show affected projects from source changes
ray affected

# Run task for specific target project
ray run web:build
```

## Configuration

Configure workspace task pipelines in `ray.config.ts`:

```typescript
import { defineConfig } from '@ray/core';

export default defineConfig({
  workspace: {
    tasks: {
      build: { cacheable: true },
      test: { cacheable: true },
      lint: { cacheable: true },
      typecheck: { cacheable: true },
    },
  },
});
```
