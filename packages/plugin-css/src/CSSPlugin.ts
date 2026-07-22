import { RayPlugin } from '@ray/core';
import { CSSPluginOptions } from './types.js';
import { processCSS } from './CSSPipeline.js';
import { generateCSSHMR } from './HMR.js';
import { globalCSSCache } from './CSSCache.js';

export function cssPlugin(options: CSSPluginOptions = {}): RayPlugin {
  return {
    name: '@ray/plugin-css',

    resolveId(id: string) {
      if (id.endsWith('.css')) return id;
      return null;
    },

    transform(code: string, id: string) {
      if (!id.endsWith('.css')) return null;

      const { jsCode, imports } = processCSS(code, id);

      globalCSSCache.set(id, {
        filename: id,
        code,
        imports,
        mtime: Date.now(),
        hash: String(code.length),
      });

      const hmrCode = generateCSSHMR(id);

      return {
        code: `${jsCode}\n${hmrCode}`,
      };
    },
  };
}

export default cssPlugin;
