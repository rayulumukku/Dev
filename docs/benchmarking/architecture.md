# Standalone Benchmarking Framework (`@ray/benchmark`)

The `@ray/benchmark` package provides a reproducible, isolated benchmarking engine for comparing performance across build tools (Ray, Vite, Webpack, Rspack).

## Architecture & Adapters

```
Benchmark CLI / API
        ↓
  Benchmark Engine (Workspace isolation & temp cleanup)
        ↓
BundlerAdapter Interface (setup, runBuild, cleanup)
   ├─ RayAdapter
   ├─ ViteAdapter
   ├─ WebpackAdapter
   └─ RspackAdapter
        ↓
MetricsCollector (mean, median, min, max, stdDev, p95)
        ↓
ReportGenerator (JSON, Markdown, HTML)
```

## CLI Usage

```bash
npx ray-benchmark --bundler ray --project small --runs 10 --output markdown
```

## Collected Metrics

- **Cold Start Time**: Time required to start cold development server.
- **Compile Time**: Initial compilation duration.
- **First Page Ready**: Time until first browser client render completes.
- **Production Build Time**: Full production asset compilation time.
- **Peak Memory Usage**: Maximum memory allocated during run.
- **CPU Time**: Total CPU processing time.
- **Bundle Size**: Total byte output of production bundle.
