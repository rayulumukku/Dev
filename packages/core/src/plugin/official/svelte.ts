import { RayPlugin } from '../index.js';
import path from 'path';

/**
 * Official Ray plugin for Svelte Single File Components (.svelte).
 * Transforms components into renderable JS classes with dynamic stylesheet injection.
 */
export function sveltePlugin(): RayPlugin {
  return {
    name: '@ray/plugin-svelte',

    async transform(code, id) {
      if (!id.endsWith('.svelte')) return null;

      const scriptMatch = code.match(/<script>([\s\S]*?)<\/script>/);
      const styleMatch = code.match(/<style>([\s\S]*?)<\/style>/);
      const templateHtml = code
        .replace(/<script>[\s\S]*?<\/script>/g, '')
        .replace(/<style>[\s\S]*?<\/style>/g, '')
        .trim();

      const scriptCode = scriptMatch ? scriptMatch[1].trim() : '';

      let compiled = `
${scriptCode}
export default class Component {
  constructor(options) {
    this.target = options.target;
    this.render();
  }
  render() {
    if (this.target) {
      this.target.innerHTML = ${JSON.stringify(templateHtml)};
    }
  }
}
`;

      if (styleMatch && styleMatch[1].trim()) {
        const css = styleMatch[1].trim();
        compiled += `\nif (typeof document !== 'undefined') {\n  const style = document.createElement('style');\n  style.innerHTML = ${JSON.stringify(css)};\n  document.head.appendChild(style);\n}\n`;
      }

      return { code: compiled };
    },
  };
}
