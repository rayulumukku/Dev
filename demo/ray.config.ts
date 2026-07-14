import { defineConfig, react, svg, mdx, wasm, json, copy } from '@ray/core';

export default defineConfig({
  plugins: [
    react(),
    svg(),
    mdx(),
    wasm(),
    json(),
    copy(),
    {
      name: 'custom:build-time',
      async transform(code, id) {
        if (id.includes('node_modules')) return null;
        if (code.includes('__BUILD_TIME__')) {
          const timestamp = new Date().toISOString();
          console.log(`[Custom Plugin] Injecting __BUILD_TIME__: ${timestamp}`);
          return {
            code: code.replace(/__BUILD_TIME__/g, timestamp)
          };
        }
        return null;
      }
    },
    {
      name: 'custom:virtual-module',
      async resolveId(id) {
        if (id === 'virtual:foo') {
          return '\0virtual:foo';
        }
        return null;
      },
      async load(id) {
        if (id === '\0virtual:foo') {
          return 'export const message = "Hello from Virtual Module foo!";';
        }
        return null;
      }
    }
  ]
});
