import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ray/migrate': path.resolve(__dirname, './packages/migrate/src/index.ts'),
      '@ray/core': path.resolve(__dirname, './packages/core/src/index.ts'),
      '@ray/dev-server': path.resolve(__dirname, './packages/dev-server/src/index.ts'),
      '@ray/transform': path.resolve(__dirname, './packages/transform/src/index.ts'),
      '@ray/hmr-runtime': path.resolve(__dirname, './packages/hmr-runtime/src/index.ts'),
      '@ray/compiler-rust': path.resolve(__dirname, './packages/compiler-rust/src/index.ts'),
    },
  },
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**',
    ],
    testTimeout: 25000,
    hookTimeout: 25000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**',
        '**/demo/**',
        '**/demo-lib/**',
      ]
    }
  }
});
