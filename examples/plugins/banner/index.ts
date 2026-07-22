import { definePlugin } from '@ray/plugin-sdk';

export interface BannerOptions {
  banner?: string;
}

export const bannerPlugin = definePlugin<BannerOptions>((options = {}) => {
  const bannerText = options.banner || '/* Built with Ray Bundler */';

  return {
    name: 'ray-plugin-banner',
    description: 'Prepend text banner comments to output JavaScript bundles.',
    async generateBundle(bundle) {
      for (const item of Object.values<any>(bundle)) {
        if (item.code) {
          item.code = `${bannerText}\n${item.code}`;
        }
      }
    },
  };
});
