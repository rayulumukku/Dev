import { definePlugin } from '@ray/plugin-sdk';
import path from 'path';

export interface AliasOptions {
  alias?: Record<string, string>;
}

export const importAliasPlugin = definePlugin<AliasOptions>((options = {}) => {
  const aliasMap = options.alias || { '@': 'src' };

  return {
    name: 'ray-plugin-import-alias',
    description: 'Resolves path aliases like "@/" to "src/".',
    async resolveId(id) {
      for (const [prefix, target] of Object.entries(aliasMap)) {
        if (id.startsWith(prefix)) {
          const relPath = id.slice(prefix.length);
          return path.resolve(this.projectRoot, target, relPath.replace(/^\//, ''));
        }
      }
      return null;
    },
  };
});
