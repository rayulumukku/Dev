import { compileMDX } from './MDXCompiler.js';

export function mdx(options = {}) {
  return {
    name: 'ray:mdx',
    async transform(code, id) {
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
