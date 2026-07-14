import { RayPlugin, PluginContext } from '../index.js';
import path from 'path';

const ASSET_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.otf'];

/**
 * Builtin plugin to handle static resources (images, SVGs, fonts).
 * When imported inside JavaScript, it transforms the asset into a module
 * exporting the browser-accessible static asset path string.
 */
export function assetsPlugin(): RayPlugin {
  return {
    name: 'ray:assets',

    async transform(this: PluginContext, code, id) {
      const cleanPath = id.split('?')[0];
      const ext = path.extname(cleanPath).toLowerCase();
      if (!ASSET_EXTENSIONS.includes(ext)) return null;

      const urlPath = '/' + path.relative(this.projectRoot, cleanPath).replace(/\\/g, '/');
      const compiledJs = `export default '${urlPath}';`;

      // Register the asset module as a node in the graph
      const node = this.graph.registerModule(cleanPath, cleanPath, urlPath);
      node.lastTransformTime = Date.now();
      this.graph.updateDependencies(cleanPath, new Set(), () => ({ file: '', url: '' }));

      return { code: compiledJs };
    },
  };
}
