import { RayPlugin } from '@ray/core';

export interface BannerOptions {
  bannerText?: string;
}

export function bannerPlugin(options: BannerOptions = {}): RayPlugin {
  const banner = options.bannerText || '/* Built with Ray Compiler */';
  let processedFilesCount = 0;

  return {
    name: 'banner-plugin',

    beforeTransform(context: any) {
      processedFilesCount++;
      // Can log or cache metadata in context
    },

    afterTransform(result: { code: string; map?: any }) {
      return {
        code: `${banner}\n${result.code}`,
        map: result.map,
      };
    },
  };
}
