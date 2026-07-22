import { MDXPluginOptions } from './types.js';
import { compileMDX } from './MDXCompiler.js';

export function mdx(options: MDXPluginOptions = {}): any {
  let mergedOptions = { ...options };

  return {
    name: '@ray/plugin-mdx',
    enforce: 'pre',

    configResolved(config: any) {
      if (config && config.mdxOptions) {
        mergedOptions = { ...config.mdxOptions, ...mergedOptions };
      }
    },

    async transform(this: any, code: string, id: string) {
      const cleanId = id.split('?')[0];
      if (!cleanId.endsWith('.mdx')) {
        return null;
      }

      // Check persistent cache store if available in PluginContext
      const cacheKey = `mdx:${cleanId}:${code.length}`;
      if (this?.cache && typeof this.cache.get === 'function') {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const result = await compileMDX(code, {
        ...mergedOptions,
        filepath: cleanId,
      });

      // Track dependencies in Ray's dependency graph if graph context is present
      if (this?.graph && typeof this.graph.registerModule === 'function') {
        const relativeUrl = '/' + (cleanId.split('src/')[1] || cleanId);
        this.graph.registerModule(cleanId, cleanId, relativeUrl);

        if (typeof this.graph.updateDependencies === 'function' && result.dependencies) {
          const depSet = new Set<string>(result.dependencies);
          this.graph.updateDependencies(cleanId, depSet, (depId: string) => ({
            file: depId,
            url: depId.startsWith('/') ? depId : '/' + depId,
          }));
        }
      }

      const output = {
        code: result.code,
        map: result.map,
      };

      // Populate persistent cache if available
      if (this?.cache && typeof this.cache.set === 'function') {
        this.cache.set(cacheKey, output);
      }

      return output;
    },

    async handleHotUpdate(this: any, ctx: { file: string; timestamp: number }) {
      if (ctx.file && ctx.file.endsWith('.mdx')) {
        if (this?.cache && typeof this.cache.invalidate === 'function') {
          this.cache.invalidate(ctx.file);
        }
        if (this?.graph && typeof this.graph.invalidate === 'function') {
          this.graph.invalidate(ctx.file);
        }
      }
    },
  };
}

export const mdxPlugin = mdx;
