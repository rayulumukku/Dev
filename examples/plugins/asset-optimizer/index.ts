import { definePlugin } from '@ray/plugin-sdk';

export const assetOptimizerPlugin = definePlugin(() => ({
  name: 'ray-plugin-asset-optimizer',
  description: 'Optimizes build assets during bundle generation.',
  async generateBundle(bundle) {
    this.emitFile('build-manifest.json', JSON.stringify({ count: Object.keys(bundle).length }));
  },
}));
