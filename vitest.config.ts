import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ray/migrate': path.resolve(__dirname, './packages/migrate/src/index.ts'),
      '@ray/plugin-compat': path.resolve(__dirname, './packages/plugin-compat/src/index.ts'),
      '@ray/core': path.resolve(__dirname, './packages/core/src/index.ts'),
      '@ray/dev-server': path.resolve(__dirname, './packages/dev-server/src/index.ts'),
      '@ray/transform': path.resolve(__dirname, './packages/transform/src/index.ts'),
      '@ray/hmr-runtime': path.resolve(__dirname, './packages/hmr-runtime/src/index.ts'),
      '@ray/compiler-rust': path.resolve(__dirname, './packages/compiler-rust/src/index.ts'),
      '@ray/plugin-mdx': path.resolve(__dirname, './packages/plugin-mdx/src/index.ts'),
      '@ray/plugin-analyzer': path.resolve(__dirname, './packages/plugin-analyzer/src/index.ts'),
      '@ray/incremental-build': path.resolve(__dirname, './packages/incremental-build/src/index.ts'),
      '@ray/plugin-sdk': path.resolve(__dirname, './packages/plugin-sdk/src/index.ts'),
      '@ray/plugin-registry': path.resolve(__dirname, './packages/plugin-registry/src/index.ts'),
      '@ray/plugin-manager': path.resolve(__dirname, './packages/plugin-manager/src/index.ts'),
      '@ray/language-server': path.resolve(__dirname, './packages/language-server/src/index.ts'),
      '@ray/vscode-extension': path.resolve(__dirname, './packages/vscode-extension/src/extension.ts'),
      '@ray/plugin-svelte': path.resolve(__dirname, './packages/plugin-svelte/src/index.ts'),
      '@ray/plugin-solid': path.resolve(__dirname, './packages/plugin-solid/src/index.ts'),
      '@ray/plugin-angular': path.resolve(__dirname, './packages/plugin-angular/src/index.ts'),
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
