# Seeded Synthetic Project Generator (`@ray/benchmark`)

The `@ray/benchmark` synthetic project generator constructs reproducible, framework-agnostic codebase workloads for benchmark execution.

## Project Scales

- `small`: 50 components, 10 routes, 25 assets.
- `medium`: 300 components, 50 routes, 100 assets.
- `large`: 1000 components, 150 routes, 300 assets.
- `huge`: 5000 components, 500 routes, 1000 assets.

## Seeded Determinism

Given the same seed parameter (`--seed 42`), the generator uses an LCG PRNG engine to produce byte-for-byte identical project trees across platforms:

```bash
ray benchmark --seed 42 --project medium
```

## Generated Files & Assets

Generated projects include:
- Nested component hierarchies (`Component0.tsx` ... `ComponentN.tsx`)
- Lazy-loaded routes (`/page-0` ... `/page-N`)
- Synthetic assets (SVG icons, CSS stylesheets, JSON data, Markdown files)
- Utility functions and constants
- Standard `package.json` and `.env` configuration
