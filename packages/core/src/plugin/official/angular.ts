import { RayPlugin } from '../index.js';

/**
 * Official Ray plugin for Angular workflows.
 * Delegates dynamically to `@ray/plugin-angular`.
 */
export function angularPlugin(options: any = {}): RayPlugin {
  try {
    const { angularPlugin: delegate } = require('@ray/plugin-angular');
    return delegate(options);
  } catch {
    return {
      name: '@ray/plugin-angular',
      async transform(code: string, id: string) {
        if (code.includes('@Component')) return { code };
        return null;
      },
    };
  }
}
