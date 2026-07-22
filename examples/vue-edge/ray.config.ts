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
