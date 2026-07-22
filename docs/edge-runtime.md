# Ray Edge Runtime Foundation (`@ray/edge-runtime`)

The `@ray/edge-runtime` package introduces a framework-agnostic Edge Runtime layer enabling Ray applications to target Web-standard edge environments (Cloudflare Workers, Vercel Edge, Deno, Netlify Edge) in addition to Node.js.

## Features

- **Web Standard APIs**: First-class support for `Request`, `Response`, `Headers`, `URL`, `fetch`, `Crypto`, and `ReadableStream`.
- **Target Selection**: Target Node.js or Edge using `ray build --target edge` or `ray build --target node`.
- **Unsupported API Detection**: Automatically detects incompatible Node.js built-ins (`fs`, `net`, `tls`, `child_process`).
- **Edge Manifest Generation**: Produces `edge-manifest.json` describing entry points, target, capabilities, and assets.
- **Polyfill Layer**: Opt-in polyfills for Web-standard APIs.

## CLI Usage

```bash
# Target Web-standard Edge runtime
ray build --target edge

# Target traditional Node.js runtime
ray build --target node
```

## Configuration

Configure runtime target in `ray.config.ts`:

```typescript
import { defineConfig } from '@ray/core';

export default defineConfig({
  runtime: {
    target: 'edge',
    edge: {
      enabled: true,
      polyfills: true,
    },
  },
});
```
