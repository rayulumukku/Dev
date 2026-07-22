import { defineConfig, react } from '@ray/core';

export default defineConfig({
  plugins: [
    react({
      rsc: {
        enabled: true,
        experimental: true,
      },
    }),
  ],
});
