# Native Ray Testing Platform (`@ray/test-runner` & `@ray/test-adapter`)

Ray provides a native, first-class testing platform that integrates directly with Ray's transform pipeline, resolver, compiler cache, dependency graph, HMR watcher, coverage collector, snapshot manager, and workspace orchestrator.

## Features

- **Zero-Config Discovery**: Automatically discovers `*.test.ts`, `*.spec.ts`, `*.test.js`, and `*.spec.js` test suites.
- **Fast Execution**: Reuses Ray's compiler transform pipeline and persistent cache.
- **Adapters Support**: Pluggable adapter architecture (`node`, `browser`, `default`).
- **Coverage Metrics**: Collects line, branch, function, and statement coverage outputs (HTML, JSON, LCOV).
- **Snapshot Testing**: Native snapshot generation, inline snapshots, updates, and validation.
- **Interactive UI**: `ray test --ui` for visual test exploration.

## CLI Usage

```bash
# Run all tests
ray test

# Watch mode with incremental reruns
ray test --watch

# Collect code coverage
ray test --coverage

# Update snapshot files
ray test --update-snapshots

# Filter tests by grep pattern
ray test --grep "Button"

# Interactive visual testing UI
ray test --ui
```

## Configuration

Configure test settings in `ray.config.ts`:

```typescript
import { defineConfig } from '@ray/core';

export default defineConfig({
  test: {
    include: ['**/*.test.ts', '**/*.spec.ts'],
    environment: 'node',
    coverage: true,
    watch: false,
  },
});
```
