# Official Vite Benchmark Adapter (`ViteAdapter`)

The `ViteAdapter` in `@ray/benchmark` defines the official implementation for benchmarking Vite against Ray using identical synthetic workloads.

## Execution Lifecycle

```
ViteAdapter.setup(workspace)
        ↓
  Inject vite.config.ts & package.json scripts
        ↓
ViteRunner.runViteBuild()
        ↓
Calculate Bundle Stats & Memory Usage
```

## Fairness Guarantees

- Identical synthetic projects generated with exact seed
- Identical Node.js runtime and environment metadata
- Identical measurement boundaries and metric collection rules
