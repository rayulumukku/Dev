import { parseSFC } from './SFCParser.js';
import { compileSFC } from './SFCCompiler.js';
import { resolveVueId } from './VueResolver.js';
import { generateVueHMR } from './HMR.js';
import { globalDescriptorCache } from './hmr/descriptorCache.js';

export function vuePlugin(options = {}) {
  return {
    name: '@ray/plugin-vue',

    resolveId(id, importer) {
      return resolveVueId(id, importer);
    },

    load(id) {
      return null;
    },

    transform(code, id) {
      if (!id.endsWith('.vue')) return null;

      const descriptor = parseSFC(code, id);
      const { type } = globalDescriptorCache.set(id, descriptor);

      const result = compileSFC(descriptor);
      const hmrCode = generateVueHMR(id, type);

      return {
        code: `${result.code}\n${hmrCode}`,
      };
    },
  };
}

export default vuePlugin;
