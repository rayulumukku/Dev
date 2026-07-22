# @ray/plugin-vue

Official Ray framework plugin providing Vue 3 Single File Component (`.vue`) compilation and HMR support.

## Features

- **Vue SFC Parsing**: Extracts `<template>`, `<script>`, `<script setup>`, `<style>`, and custom blocks.
- **Transform Integration**: Compiles Vue templates and script blocks into standard ES module code executed via Ray's native transform pipeline.
- **Style Extraction & Injection**: Automatically extracts `<style>` blocks and injects styles during development.
- **HMR Integration**: Hooks into Ray's HMR runtime for component updates.

## Usage

```typescript
import { defineConfig } from '@ray/core';
import vuePlugin from '@ray/plugin-vue';

export default defineConfig({
  plugins: [
    vuePlugin()
  ]
});
```
