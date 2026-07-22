import { defineConfig } from '@ray/core';

export default defineConfig({
  test: {
    include: ['**/*.spec.js', '**/*.test.js'],
    environment: 'node',
  },
});
