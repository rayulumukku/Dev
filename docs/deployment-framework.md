# Deployment Adapter Framework (`@ray/deployment`)

The `@ray/deployment` package provides a provider-agnostic deployment framework that allows hosting platforms (static hosting, generic Node.js servers, Edge runtimes, serverless) to integrate with Ray through adapter plugins.

## Features

- **Provider-Agnostic Adapter Lifecycle**: `prepare()`, `validate()`, `bundle()`, `generateManifest()`, `finalize()`.
- **Capability Negotiation**: Match adapter capabilities against project requirements (`static`, `node`, `edge`, `ssr`, `ssg`).
- **Artifact Reuse**: Packages existing build artifacts from `dist/` without triggering redundant rebuilds.
- **Deployment Planning**: Generates structured deployment plans (`ray deploy --plan`).
- **Dry-Run Mode**: Validate artifact completeness and runtime compatibility (`ray deploy --dry-run`).

## CLI Usage

```bash
# Generate deployment plan
ray deploy --plan

# Run deployment validation in dry-run mode
ray deploy --dry-run

# Deploy using a custom adapter
ray deploy --adapter cloudflare
```

## Adapter Authoring API

```typescript
import { defineDeploymentAdapter } from '@ray/deployment';

export default defineDeploymentAdapter({
  name: 'my-custom-adapter',
  capabilities: {
    static: true,
    node: true,
    edge: true,
    ssr: true,
    ssg: true,
  },
  async prepare(ctx) {},
  async validate(ctx) { return true; },
  async bundle(ctx) {},
  async generateManifest(ctx) { return {}; },
  async finalize(ctx) {},
});
```
