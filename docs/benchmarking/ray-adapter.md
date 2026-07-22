# Official Ray Benchmark Adapter (`RayAdapter`)

The `RayAdapter` in `@ray/benchmark` defines the official implementation for executing benchmark projects using Ray's public CLI interfaces (`ray dev` and `ray build`).

## Execution Lifecycle

```
RayAdapter.setup(workspace)
        ↓
StartupRunner.measureColdStart()
        ↓
HMRLatency.measureHMRLatency()
        ↓
BuildRunner.calculateBundleSize()
        ↓
Collect Process Resource Usage (peak RSS & CPU)
```

## Contract Compliance

All future bundler adapters (Vite, Webpack, Rspack) must implement the same `BundlerAdapter` interface:

```typescript
export interface BundlerAdapter {
  name: string;
  version: string;
  setup(workspaceDir: string): Promise<void>;
  runBuild(workspaceDir: string): Promise<RawMetrics>;
  cleanup?(workspaceDir: string): Promise<void>;
}
```
