import { defineConfig } from '@ray/core';
import { svelte } from '@ray/plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        dev: true,
      },
    }),
  ],
});
