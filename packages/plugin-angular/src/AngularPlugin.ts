import { AngularPluginOptions } from './types.js';
import { AngularCompiler } from './AngularCompiler.js';
import { defineFramework } from '@ray/framework-runtime';
import path from 'path';

export function angularPlugin(options: AngularPluginOptions = {}): any {
  defineFramework({
    name: '@ray/plugin-angular',
    version: '1.0.0',
    capabilities: {
      devRuntime: true,
      hmr: true,
      ssr: true,
      ssg: true,
      hydration: true,
      cssProcessing: true,
      diagnostics: true,
    },
    hooks: {
      transform: (code, id) => {
        if (!id.endsWith('.ts') && !id.endsWith('.html')) return null;
        const res = AngularCompiler.compile(code, id, options);
        return { code: res.code };
      },
    },
  });

  return {
    name: '@ray/plugin-angular',
    version: '1.0.0',
    description: 'Official Ray Angular compilation plugin.',
    compatibility: {
      minRayVersion: '1.0.0',
    },

    async transform(code: string, id: string) {
      const ext = path.extname(id);
      if (!['.ts', '.html'].includes(ext)) return null;

      // Skip non-Angular TypeScript files unless @Component / @NgModule / @Injectable is present
      if (ext === '.ts' && !code.includes('@Component') && !code.includes('@NgModule') && !code.includes('@Injectable') && !code.includes('@angular')) {
        return null;
      }

      const cacheKey = `angular:${id}:${code.length}`;
      if (this.cache) {
        const cached = this.cache.get(cacheKey);
        if (cached) return cached;
      }

      const isServer = options.isServer || (this.buildMode === 'production' && options.aot);
      const result = AngularCompiler.compile(code, id, { ...options, isServer });

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
      if (ctx.file.endsWith('.ts') || ctx.file.endsWith('.html')) {
        console.log(`[Ray Angular Plugin] Hot update detected for ${ctx.file}`);
      }
    },
  };
}

export { angularPlugin as angular };
