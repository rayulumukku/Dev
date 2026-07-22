import { defineConfig } from '@ray/core';

export default defineConfig({
  test: {
    include: ['**/*.test.tsx', '**/*.test.ts'],
    environment: 'node',
    coverage: true,
  },
});
