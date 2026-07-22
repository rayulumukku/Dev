import { defineConfig } from '@ray/core';
import { angular } from '@ray/plugin-angular';

export default defineConfig({
  plugins: [
    angular({
      aot: true,
      strictTemplates: true,
    }),
  ],
});
