import { RayPlugin } from '@ray/core';
import { VuePluginOptions } from './types.js';
import { parseSFC } from './SFCParser.js';
import { compileSFC } from './SFCCompiler.js';
import { resolveVueId } from './VueResolver.js';
import { generateVueHMR } from './HMR.js';

export function vuePlugin(options: VuePluginOptions = {}): RayPlugin {
  return {
    name: '@ray/plugin-vue',

    resolveId(id: string, importer?: string) {
      return resolveVueId(id, importer);
    },

    load(id: string) {
      return null;
    },

    transform(code: string, id: string) {
      if (!id.endsWith('.vue')) return null;

      const descriptor = parseSFC(code, id);
      const result = compileSFC(descriptor);
      const hmrCode = generateVueHMR(id);

      return {
        code: `${result.code}\n${hmrCode}`,
      };
    },
  };
}

export default vuePlugin;
