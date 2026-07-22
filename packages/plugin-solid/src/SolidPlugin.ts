import { SolidPluginOptions } from './types.js';
import { SolidCompiler } from './SolidCompiler.js';
import path from 'path';

export function solidPlugin(options: SolidPluginOptions = {}): any {
  return {
    name: '@ray/plugin-solid',
    version: '1.0.0',
    description: 'Official Ray SolidJS compilation plugin.',
    compatibility: {
      minRayVersion: '1.0.0',
    },

    async transform(code: string, id: string) {
      const ext = path.extname(id);
      if (!['.jsx', '.tsx'].includes(ext) && !id.endsWith('.solid.tsx')) return null;

      // Skip non-Solid files unless solid-js is referenced or explicitly .solid.tsx
      if (!id.endsWith('.solid.tsx') && !code.includes('solid-js') && !code.includes('createSignal') && !code.includes('JSX')) {
        return null;
      }

      const cacheKey = `solid:${id}:${code.length}`;
      if (this.cache) {
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;
      }

      const isSSR = options.generate === 'ssr';
      const result = SolidCompiler.compile(code, id, { ...options, generate: isSSR ? 'ssr' : 'dom' });

      if (this.graph && typeof this.graph.addDependency === 'function') {
        for (const dep of result.dependencies) {
          this.graph.addDependency(id, dep);
        }
      }

      const output = {
        code: result.code,
        map: result.map,
      };

      if (this.cache) {
        this.cache.set(cacheKey, output);
      }

      return output;
    },

    async handleHotUpdate(ctx: { file: string; timestamp: number }) {
      if (ctx.file.endsWith('.jsx') || ctx.file.endsWith('.tsx') || ctx.file.endsWith('.solid.tsx')) {
        console.log(`[Ray Solid Plugin] Hot update detected for ${ctx.file}`);
      }
    },
  };
}

export { solidPlugin as solid };
