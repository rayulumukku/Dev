import { defineConfig } from '@ray/core';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'DemoLibrary',
      formats: ['esm', 'cjs', 'umd'],
      external: ['react', 'react-dom'],
    },
    banner: '/* DemoLibrary production bundle */',
    footer: '/* end of bundle */',
  },
});
