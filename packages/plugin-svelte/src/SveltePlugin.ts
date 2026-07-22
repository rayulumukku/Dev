import { SveltePluginOptions } from './types.js';
import { SvelteCompiler } from './SvelteCompiler.js';

export function sveltePlugin(options: SveltePluginOptions = {}): any {
  return {
    name: '@ray/plugin-svelte',
    version: '1.0.0',
    description: 'Official Ray Svelte compilation plugin.',
    compatibility: {
      minRayVersion: '1.0.0',
    },

    async transform(code: string, id: string) {
      if (!id.endsWith('.svelte')) return null;

      const cacheKey = `svelte:${id}:${code.length}`;
      if (this.cache) {
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;
      }

      const isServer = options.isServer || this.buildMode === 'production' && options.compilerOptions?.generate === 'server';
      const result = SvelteCompiler.compile(code, id, { ...options, isServer });

      if (this.graph && typeof this.graph.addDependency === 'function') {
        for (const dep of result.dependencies) {
          this.graph.addDependency(id, dep);
        }
      }

      const output = {
        code: result.js.code,
        map: result.js.map,
      };

      if (this.cache) {
        this.cache.set(cacheKey, output);
      }

      return output;
    },

    async handleHotUpdate(ctx: { file: string; timestamp: number }) {
      if (ctx.file.endsWith('.svelte')) {
        console.log(`[Ray Svelte Plugin] Hot update detected for ${ctx.file}`);
      }
    },
  };
}

export { sveltePlugin as svelte };
