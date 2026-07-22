import { RayPlugin } from '../index.js';

/**
 * Official Ray plugin for Svelte Single File Components (.svelte).
 * Delegates dynamically to `@ray/plugin-svelte`.
 */
export function sveltePlugin(options: any = {}): RayPlugin {
  try {
    const { sveltePlugin: delegate } = require('@ray/plugin-svelte');
    return delegate(options);
  } catch {
    return {
      name: '@ray/plugin-svelte',
      async transform(code: string, id: string) {
        if (!id.endsWith('.svelte')) return null;
        return { code: `export default class SvelteComponent {}` };
      },
    };
  }
}
