import { MDXPluginOptions } from './types.js';
import { compileMDX } from './MDXCompiler.js';

export function mdx(options: MDXPluginOptions = {}): any {
  return {
    name: 'ray:mdx',
    async transform(code: string, id: string) {
      if (!id.endsWith('.mdx')) {
        return null;
      }

      const result = await compileMDX(code, options);
      return {
        code: result.code,
        map: null,
      };
    },
  };
}
