import { defineConfig } from '@ray/core';

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
  },
});
