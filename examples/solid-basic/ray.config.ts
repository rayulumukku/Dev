import { defineConfig } from '@ray/core';
import { solid } from '@ray/plugin-solid';

export default defineConfig({
  plugins: [
    solid({
      dev: true,
      hydratable: true,
    }),
  ],
});
