import { RayPlugin } from '../index.js';

/**
 * Official Ray plugin for SolidJS workflows.
 * Delegates dynamically to `@ray/plugin-solid`.
 */
export function solidPlugin(options: any = {}): RayPlugin {
  try {
    const { solidPlugin: delegate } = require('@ray/plugin-solid');
    return delegate(options);
  } catch {
    return {
      name: '@ray/plugin-solid',
      async transform(code: string, id: string) {
        if (code.includes('solid-js')) return { code };
        return null;
      },
    };
  }
}
