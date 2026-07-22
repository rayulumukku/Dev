# @ray/plugin-css

Official Ray plugin providing a plugin-based CSS processing pipeline, `@import` resolution, caching, and in-place HMR updates.

## Features

- **Native Plugin Architecture**: Integrates entirely through Ray's native plugin API hooks (`resolveId`, `transform`).
- **CSS Cache & Dependency Graph**: Maintains in-memory caching and tracks nested `@import` dependencies.
- **In-Place CSS HMR**: Updates styles dynamically in the document head without reloading JavaScript or disrupting component state.
- **Production Asset Extraction**: Prepares CSS bundles for production build emission.

## Usage

```typescript
import { defineConfig } from '@ray/core';
import cssPlugin from '@ray/plugin-css';

export default defineConfig({
  plugins: [
    cssPlugin()
  ]
});
```
