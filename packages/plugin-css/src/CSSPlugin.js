import { processCSS } from './CSSPipeline.js';
import { generateCSSHMR } from './HMR.js';
import { globalCSSCache } from './CSSCache.js';

export function cssPlugin(options = {}) {
  return {
    name: '@ray/plugin-css',

    resolveId(id) {
      if (id.endsWith('.css')) return id;
      return null;
    },

    transform(code, id) {
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
