import { RayPlugin } from '../index.js';
import path from 'path';

/**
 * Builtin plugin for injecting HMR Client HotContext initialization blocks
 * at the top of user project JS/JSX/TS/TSX files.
 */
export function hmrPlugin(): RayPlugin {
  return {
    name: 'ray:hmr',
    enforce: 'pre',

    async transform(code, id) {
      const cleanPath = id.split('?')[0];
      const ext = path.extname(cleanPath);
      const isJs = ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
      if (!isJs) return null;

      const isProjectFile = !id.includes('node_modules');
      if (!isProjectFile) return null;

      // Prepend the HotContext initialization block
      const hotContextInjected = `
if (!import.meta.hot) {
  import.meta.hot = window.__ray_create_hot_context(import.meta.url);
}
\n${code}`;

      return { code: hotContextInjected };
    },
  };
}
