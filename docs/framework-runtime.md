# Framework Runtime Abstraction Layer (`@ray/framework-runtime`)

The `@ray/framework-runtime` package introduces a stable, framework-independent integration abstraction that enables UI frameworks (React, Vue, Svelte, Solid, Angular, etc.) to integrate with Ray via unified interfaces without embedding framework-specific logic into Ray core.

## Architecture

The framework runtime abstraction consists of:

1. **defineFramework()**: Helper API for defining framework adapters.
2. **CapabilityRegistry**: Capability negotiation validator ensuring required features (SSR, HMR, Server Components) are supported by registered framework adapters.
3. **RuntimeRegistry**: Central registry storing active framework adapters and resolving file extension targets.
4. **DevRuntime & HMRRuntime**: Framework-independent development transform and HMR lifecycle managers.
5. **SSRRuntime & HydrationRuntime**: SSR rendering orchestrator and hydration metadata manager.
6. **DiagnosticsRuntime**: Aggregate compile, runtime, and editor diagnostics across frameworks.

## Usage Example

```typescript
import { defineFramework } from '@ray/framework-runtime';

export const myFrameworkAdapter = defineFramework({
  name: 'my-custom-framework',
  version: '1.0.0',
  capabilities: {
    devRuntime: true,
    hmr: true,
    ssr: true,
    hydration: true,
    diagnostics: true,
  },
  hooks: {
    transform: async (code, id) => {
      // Framework-specific code transformation
      return { code: `/* transformed */ ${code}` };
    },
    renderSSR: async (module, props) => {
      return { html: '<div id="app">Custom SSR HTML</div>' };
    },
    onHMRUpdate: (file) => {
      console.log(`[My Framework] HMR update for ${file}`);
    },
  },
});
```

## Migration Guide for Plugin Authors

To migrate an existing framework plugin:

1. Import `defineFramework` from `@ray/framework-runtime`.
2. Register your framework capabilities (`devRuntime`, `hmr`, `ssr`, `diagnostics`).
3. Delegate transform and SSR render hooks to `defineFramework()`.
