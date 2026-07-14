import { RayPlugin, PluginContext } from '../index.js';
import path from 'path';

/**
 * Builtin plugin for compiling raw CSS text into dynamic ES Module wrappers.
 */
export function cssPlugin(): RayPlugin {
  return {
    name: 'ray:css',

    async transform(this: PluginContext, code, id) {
      // Check if it is a CSS request and has the import flag
      const isCss = id.includes('.css');
      if (!isCss) return null;

      const isImport = id.includes('?import') || id.includes('&import');
      if (!isImport) return null;

      // Extract base pathname without queries for element ID mapping
      const urlPath = '/' + path.relative(this.projectRoot, id.split('?')[0]).replace(/\\/g, '/');

      const escaped = code
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '');

      const compiledJs = `
const css = '${escaped}';
const id = '${urlPath}';
let style = document.getElementById(id);
if (!style) {
  style = document.createElement('style');
  style.id = id;
  document.head.appendChild(style);
}
style.textContent = css;
export default css;
`;

      // Register the CSS module as a node in the graph
      const node = this.graph.registerModule(id.split('?')[0], id.split('?')[0], urlPath);
      node.lastTransformTime = Date.now();
      this.graph.updateDependencies(id.split('?')[0], new Set(), () => ({ file: '', url: '' }));

      return { code: compiledJs };
    },
  };
}
