import { RuntimeRegistry } from './RuntimeRegistry.js';

export class ManifestRuntime {
  static generateCombinedManifest(): Record<string, any> {
    const combined: Record<string, any> = {};
    for (const adapter of RuntimeRegistry.getAdapters()) {
      if (adapter.hooks?.generateManifest) {
        combined[adapter.name] = adapter.hooks.generateManifest();
      }
    }
    return combined;
  }
}
