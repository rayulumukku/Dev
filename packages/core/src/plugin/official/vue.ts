import { RayPlugin } from '../index.js';
import path from 'path';

/**
 * Official Ray plugin for Vue Single File Components (.vue).
 * Parses script, template, and style blocks and exports a client component.
 */
export function vuePlugin(): RayPlugin {
  return {
    name: '@ray/plugin-vue',

    async transform(code, id) {
      if (!id.endsWith('.vue')) return null;

      // Extract script, template, and style blocks
      const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      const templateMatch = code.match(/<template[^>]*>([\s\S]*?)<\/template>/);
      const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);

      const scriptCode = scriptMatch ? scriptMatch[1].trim() : 'export default {}';
      const templateHtml = templateMatch ? templateMatch[1].trim() : '';

      // Re-assign default export of the script to a variable
      let jsCode = scriptCode.replace(/export\s+default\s+/, 'const _sfc_main = ');
      if (!jsCode.includes('_sfc_main')) {
        jsCode += '\nconst _sfc_main = {};';
      }

      // Assemble Sfc
      let compiled = `${jsCode}\n`;
      compiled += `_sfc_main.template = ${JSON.stringify(templateHtml)};\n`;
      compiled += `export default _sfc_main;\n`;

      // Inject styles if style block is present
      if (styleMatch && styleMatch[1].trim()) {
        const css = styleMatch[1].trim();
        compiled += `\nif (typeof document !== 'undefined') {\n  const style = document.createElement('style');\n  style.innerHTML = ${JSON.stringify(css)};\n  document.head.appendChild(style);\n}\n`;
      }

      return { code: compiled };
    },
  };
}
