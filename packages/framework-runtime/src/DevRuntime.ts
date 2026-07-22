import { RuntimeRegistry } from './RuntimeRegistry.js';

export class DevRuntime {
  static async transformFile(code: string, id: string): Promise<{ code: string; map?: any } | null> {
    const adapters = RuntimeRegistry.resolveActiveAdapters(id);
    for (const adapter of adapters) {
      if (adapter.hooks?.transform) {
        const res = await adapter.hooks.transform(code, id);
        if (res) return res;
      }
    }
    return null;
  }
}
