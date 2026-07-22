import { RayPlugin } from '@ray/core';
import { CSSPluginOptions } from './types.js';
import { processCSS } from './CSSPipeline.js';
import { processCSSModule } from './modules/CSSModules.js';
import { generateCSSHMR } from './HMR.js';
import { globalCSSCache } from './CSSCache.js';

export function cssPlugin(options: CSSPluginOptions = {}): RayPlugin {
  return {
    name: '@ray/plugin-css',

    resolveId(id: string) {
      if (id.endsWith('.css')) return id;
      return null;
    },

    transform(code: string, id: string, context?: any) {
      if (!id.endsWith('.css')) return null;

      const isProduction = context?.isProduction ?? false;

      // Handle CSS Modules (*.module.css)
      if (id.endsWith('.module.css')) {
        const { jsCode } = processCSSModule(code, id, isProduction);
        const hmrCode = generateCSSHMR(id);
        return {
          code: `${jsCode}\n${hmrCode}`,
        };
      }

      // Handle regular CSS files (.css)
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
