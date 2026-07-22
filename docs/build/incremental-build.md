# Incremental Production Build Support (`@ray/incremental-build`)

Ray's incremental production build engine reduces rebuild times by reusing outputs from previous production builds while guaranteeing byte-for-byte output equivalence to a clean build.

## Architecture

The incremental build pipeline consists of 7 modular engines:

1. **ChangeDetector**: Computes SHA-256 hashes for source files, dependency graphs, assets, configurations, environment variables, plugins, and Ray engine versions.
2. **AffectedGraph**: Uses Ray's `DependencyGraph` to traverse dependent modules and mark imported modules as invalidated when dependencies change.
3. **BuildPlanner**: Classifies every module into one of five states: `unchanged`, `affected`, `invalidated`, `rebuilt`, or `reused`.
4. **ArtifactStore**: Persists build manifests, compiled JS/CSS bundles, source maps, and asset hashes in `.ray/incremental/`.
5. **ManifestComparer**: Compares build manifests between builds to detect file drift, missing artifacts, or structural changes.
6. **OutputValidator**: Validates incremental outputs against expected clean-build file hashes, chunk graphs, and manifests.
7. **IncrementalBuildEngine**: Orchestrates the incremental build lifecycle and exposes telemetry metrics to `ray stats`.

## Invalidation Strategy

Ray automatically invalidates cached artifacts under the following conditions:

- **Source File Changed**: The content SHA-256 hash of a file has changed.
- **Dependency Changed**: An imported module or asset dependency was modified.
- **Configuration Changed**: `ray.config.ts` or build configuration options were altered.
- **Environment Changed**: Environment variables (`process.env`) were modified.
- **Plugin Changed**: Plugin list or plugin configuration options changed.
- **Engine Version Changed**: Ray or Node.js runtime version updated.
- **Validation Mismatch**: Output hash validation detected a discrepancy between cached artifacts and expected outputs.

If any uncertainty exists about cache correctness, Ray automatically performs a clean fallback build instead of risking stale artifacts.

## CLI Usage

Incremental builds can be controlled via command line flags:

```bash
# Enable incremental production build
ray build --incremental

# Force a clean build (clearing previous incremental manifests and outDir)
ray build --clean

# Explicitly disable incremental caching
ray build --no-incremental
```

## Configuration

Enable incremental builds permanently in `ray.config.ts`:

```typescript
import { defineConfig } from '@ray/core';

export default defineConfig({
  build: {
    incremental: true,
    validateOutputs: true,
  },
});
```

## Telemetry Metrics (`ray stats`)

View incremental build metrics using the `ray stats` command:

```bash
ray stats
```

Output includes:
- **Reused Artifacts**: Number of unchanged modules reused from cache.
- **Rebuilt Artifacts**: Number of affected or invalidated modules rebuilt.
- **Incremental Hit Ratio**: Percentage of modules served from cache.
- **Build Time Savings**: Estimated build duration saved (in milliseconds).
- **Invalidation Reasons**: Categorized breakdown of cache misses.

## CI Recommendations

1. **Persist Cache Directory**: Cache `.ray/incremental/` across CI runs using GitHub Actions `actions/cache` or CI cache layer.
2. **Clean Fallbacks on Release**: Use `ray build --clean` on production release tags to guarantee clean outputs.
3. **Enable Output Validation**: Keep `validateOutputs: true` enabled in CI to catch potential cache drift.
