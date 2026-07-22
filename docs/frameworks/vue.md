# Vue 3 Framework Integration (`@ray/plugin-vue`)

Ray supports Vue 3 Single File Components (`.vue`) via the official `@ray/plugin-vue` plugin built entirely on top of Ray's native plugin architecture.

## Installation

```bash
npm install --save-dev @ray/plugin-vue
```

## Configuration (`ray.config.ts`)

```typescript
import { defineConfig } from '@ray/core';
import vuePlugin from '@ray/plugin-vue';

export default defineConfig({
  plugins: [
    vuePlugin()
  ]
});
```

## Features

- **Single File Component (.vue) Parsing**: Extracts `<template>`, `<script>`, `<script setup>`, `<style>`, and custom blocks.
- **Ray Transform Pipeline**: Generated JavaScript passes through Ray's transform pipeline and esbuild backend.
- **Styles**: Automatically extracts and injects component CSS during development.
- **HMR Integration**: Fully integrated with Ray's HMR runtime.

## Known Limitations

- Scoped CSS and CSS Modules will be added in a future PR phase.
- Vue Router and Pinia integrations will be provided via dedicated ecosystem packages.
