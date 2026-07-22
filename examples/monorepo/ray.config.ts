import { defineConfig } from '@ray/core';

export default defineConfig({
  workspace: {
    tasks: {
      build: { cacheable: true },
      test: { cacheable: true },
      lint: { cacheable: true },
      typecheck: { cacheable: true },
    },
  },
});
