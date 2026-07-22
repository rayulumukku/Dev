import { RayPlugin } from '@ray/core';
import { CSSPluginOptions } from './types.js';
import { processCSS } from './CSSPipeline.js';
import { processCSSModule } from './modules/CSSModules.js';
import { compileSass } from './sass/SassCompiler.js';
import { generateCSSHMR } from './HMR.js';
import { globalCSSCache } from './CSSCache.js';

export function cssPlugin(options: CSSPluginOptions = {}): RayPlugin {
  return {
    name: '@ray/plugin-css',

    resolveId(id: string) {
      if (/\.(css|scss|sass)(\?.*)?$/.test(id)) return id;
      return null;
    },

    transform(code: string, id: string, context?: any) {
      if (!/\.(css|scss|sass)(\?.*)?$/.test(id)) return null;

      const isProduction = context?.isProduction ?? false;
      let rawCSS = code;

      // 1. Compile SCSS / Sass if applicable
      if (id.endsWith('.scss') || id.endsWith('.sass')) {
        const compiledSass = compileSass(code, id);
        rawCSS = compiledSass.css;
      }

      // 2. Handle CSS Modules (*.module.css / *.module.scss / *.module.sass)
      if (id.includes('.module.')) {
        const { jsCode } = processCSSModule(rawCSS, id, isProduction);
        const hmrCode = generateCSSHMR(id);
        return {
          code: `${jsCode}\n${hmrCode}`,
        };
      }

      // 3. Handle regular CSS / compiled SCSS
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
