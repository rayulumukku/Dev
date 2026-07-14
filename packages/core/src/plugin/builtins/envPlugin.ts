import { RayPlugin, PluginContext } from '../index.js';

/**
 * Builtin environment variables pre-processor plugin.
 * Substitutes import.meta.env.* builtins, user environmental keys,
 * and define constants at compile-time.
 */
export function envPlugin(env: Record<string, string>, mode: string, prefix = 'RAY_', define: Record<string, any> = {}): RayPlugin {
  return {
    name: 'ray:env',
    enforce: 'pre',

    async transform(this: PluginContext, code, id) {
      if (id.includes('node_modules')) return null;
      if (!['.js', '.jsx', '.ts', '.tsx', '.html'].some((ext) => id.endsWith(ext))) return null;

      let finalCode = code;

      // 1. Map environment variables
      const isDev = mode === 'development';
      const isProd = mode === 'production' || mode === 'staging';

      const envs: Record<string, string> = {
        MODE: JSON.stringify(mode),
        DEV: String(isDev),
        PROD: String(isProd),
        SSR: String(this.buildMode === 'production' && id.includes('entry-server')),
        BASE_URL: JSON.stringify('/'),
      };

      // Populate user variables matching prefix constraints
      for (const [key, val] of Object.entries(env)) {
        if (key.startsWith(prefix)) {
          envs[key] = JSON.stringify(val);
        }
      }

      // Replace import.meta.env.KEY instances
      finalCode = finalCode.replace(/\bimport\.meta\.env\.([a-zA-Z0-9_]+)\b/g, (match, key) => {
        if (envs[key] !== undefined) {
          return envs[key];
        }
        return 'undefined';
      });

      // Replace full import.meta.env object references
      const rawEnv: Record<string, any> = {};
      for (const [k, v] of Object.entries(envs)) {
        rawEnv[k] = JSON.parse(v);
      }
      const fullEnvObj = JSON.stringify(rawEnv);
      finalCode = finalCode.replace(/\bimport\.meta\.env\b/g, fullEnvObj);

      // 2. Map define constants
      for (const [key, val] of Object.entries(define)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        const replacement = typeof val === 'string' ? val : JSON.stringify(val);
        finalCode = finalCode.replace(regex, replacement);
      }

      return { code: finalCode };
    },
  };
}
