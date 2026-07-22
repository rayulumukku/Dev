import { RayPlugin } from '../index.js';
/**
 * Builtin environment variables pre-processor plugin.
 * Substitutes import.meta.env.* builtins, user environmental keys,
 * and define constants at compile-time.
 */
export declare function envPlugin(env: Record<string, string>, mode: string, prefix?: string, define?: Record<string, any>): RayPlugin;
//# sourceMappingURL=envPlugin.d.ts.map