import { RayPlugin } from '../index.js';

/**
 * Official Ray plugin wrapper for MDX.
 * Dynamically delegates to @ray/plugin-mdx.
 */
export function mdxPlugin(options: any = {}): RayPlugin {
  return {
    name: '@ray/plugin-mdx',
    enforce: 'pre',

    async transform(this: any, code: string, id: string) {
      if (!id.split('?')[0].endsWith('.mdx')) return null;
      try {
        const mod = await import('@ray/plugin-mdx');
        const plugin = (mod.mdx || mod.default)(options);
        return plugin.transform.call(this, code, id);
      } catch {
        return null;
      }
    },
  };
}
