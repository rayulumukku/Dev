import { RayPlugin } from '../index.js';
import path from 'path';

/**
 * Official Ray plugin for ESLint syntax checks.
 * Runs lightweight lint diagnostics during code transformations.
 */
export function eslintPlugin(): RayPlugin {
  return {
    name: '@ray/plugin-eslint',

    async transform(code, id) {
      const ext = path.extname(id);
      if (!['.js', '.jsx', '.ts', '.tsx'].includes(ext)) return null;
      if (id.includes('node_modules')) return null;

      // Basic diagnostics check
      if (code.includes('debugger')) {
        this.logger.warn(`[Ray ESLint] Warning in ${path.basename(id)}: Avoid 'debugger' statement in production code.`);
      }
      return null;
    },
  };
}
