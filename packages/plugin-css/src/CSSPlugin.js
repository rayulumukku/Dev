import { processCSS } from './CSSPipeline.js';
import { processCSSModule } from './modules/CSSModules.js';
import { compileSass } from './sass/SassCompiler.js';
import { generateCSSHMR } from './HMR.js';
import { globalCSSCache } from './CSSCache.js';

export function cssPlugin(options = {}) {
  return {
    name: '@ray/plugin-css',

    resolveId(id) {
      if (/\.(css|scss|sass)(\?.*)?$/.test(id)) return id;
      return null;
    },

    transform(code, id, context) {
      if (!/\.(css|scss|sass)(\?.*)?$/.test(id)) return null;

      const isProduction = context?.isProduction ?? false;
      let rawCSS = code;

      if (id.endsWith('.scss') || id.endsWith('.sass')) {
        const compiledSass = compileSass(code, id);
        rawCSS = compiledSass.css;
      }

      if (id.includes('.module.')) {
        const { jsCode } = processCSSModule(rawCSS, id, isProduction);
        const hmrCode = generateCSSHMR(id);
        return {
          code: `${jsCode}\n${hmrCode}`,
        };
      }

      const { jsCode, imports } = processCSS(rawCSS, id);

      globalCSSCache.set(id, {
        filename: id,
        code: rawCSS,
        imports,
        mtime: Date.now(),
        hash: String(rawCSS.length),
      });

      const hmrCode = generateCSSHMR(id);

      return {
        code: `${jsCode}\n${hmrCode}`,
      };
    },
  };
}

export default cssPlugin;
