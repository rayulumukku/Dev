import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ray/fs': path.resolve(__dirname, './packages/fs/src/index.ts'),
      '@ray/benchmark': path.resolve(__dirname, './packages/benchmark/src/index.ts'),
      '@ray/cache': path.resolve(__dirname, './packages/cache/src/index.ts'),
      '@ray/cli': path.resolve(__dirname, './packages/cli/src/cli.ts'),
      'create-ray': path.resolve(__dirname, './packages/create-ray/src/index.ts'),
      'create-ray-plugin': path.resolve(__dirname, './packages/create-ray-plugin/src/cli.ts'),
      '@ray/graph-inspector': path.resolve(__dirname, './packages/graph-inspector/src/index.ts'),
      '@ray/plugin-css': path.resolve(__dirname, './packages/plugin-css/src/index.ts'),
      '@ray/plugin-vue': path.resolve(__dirname, './packages/plugin-vue/src/index.ts'),
      '@ray/remote-cache': path.resolve(__dirname, './packages/remote-cache/src/index.ts'),
      '@ray/ssg': path.resolve(__dirname, './packages/ssg/src/index.ts'),
      '@ray/ssr': path.resolve(__dirname, './packages/ssr/src/index.ts'),
      '@ray/workspace': path.resolve(__dirname, './packages/workspace/src/index.ts'),
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
      '@ray/react-server': path.resolve(__dirname, './packages/react-server/src/index.ts'),
      '@ray/server-actions': path.resolve(__dirname, './packages/server-actions/src/index.ts'),
      '@ray/framework-runtime': path.resolve(__dirname, './packages/framework-runtime/src/index.ts'),
      '@ray/project-graph': path.resolve(__dirname, './packages/project-graph/src/index.ts'),
      '@ray/test-adapter': path.resolve(__dirname, './packages/test-adapter/src/index.ts'),
      '@ray/test-runner': path.resolve(__dirname, './packages/test-runner/src/index.ts'),
      '@ray/observability': path.resolve(__dirname, './packages/observability/src/index.ts'),
      '@ray/inspector': path.resolve(__dirname, './packages/inspector/src/index.ts'),
      '@ray/edge-runtime': path.resolve(__dirname, './packages/edge-runtime/src/index.ts'),
      '@ray/deployment': path.resolve(__dirname, './packages/deployment/src/index.ts'),
      'create-deployment-adapter': path.resolve(__dirname, './packages/create-deployment-adapter/src/cli.ts'),
      '@ray/release': path.resolve(__dirname, './packages/release/src/index.ts'),
      '@ray/api-contract': path.resolve(__dirname, './packages/api-contract/src/index.ts'),
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
