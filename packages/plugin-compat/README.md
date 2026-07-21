# @ray/plugin-compat

This package provides a Vite Plugin Compatibility Layer for the Ray compiler and dev-server, enabling standard Vite plugins to execute inside Ray without modification.

## Features & Lifecycle Hooks

### Supported Hooks in this version:
- `resolveId`: Standard module resolver mapping.
- `load`: Custom module loaders.
- `transform`: Chained text and AST transformations.
- `handleHotUpdate`: Custom file update mapping within HMR runtime.

### Unsupported Hooks (to be implemented in future phases):
- `configureServer`
- `config`
- `configResolved`
- `buildStart`
- `buildEnd`
- `generateBundle`
- `writeBundle`
- `closeBundle`

## Compatibility Guarantees

- **Context Isolation**: Exposes standard Rollup/Vite `PluginContext` attributes (`root`, `mode`, `command`) and helper methods (`resolve`, `addWatchFile`, `warn`, `error`).
- **Error Bubbling**: Automatically catches asynchronous hook exceptions and bubbles them labeled with the plugin name (`[Plugin: name]`).
- **Dev Server Stability**: Unimplemented or missing plugin hooks do not cause crashes. They are skipped gracefully.

## Example Adapter Usage

Wrap a standard Vite plugin with `adaptVitePlugin` when registering plugins in `ray.config.ts`:

```typescript
import { defineConfig } from '@ray/core';
import { adaptVitePlugin } from '@ray/plugin-compat';
import legacyVitePlugin from 'vite-plugin-legacy-example';

export default defineConfig({
  plugins: [
    adaptVitePlugin(legacyVitePlugin({
      option1: true
    }))
  ]
});
```
