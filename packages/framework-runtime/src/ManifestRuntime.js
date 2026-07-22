import { RuntimeRegistry } from './RuntimeRegistry.js';
export class ManifestRuntime {
    static generateCombinedManifest() {
        const combined = {};
        for (const adapter of RuntimeRegistry.getAdapters()) {
            if (adapter.hooks?.generateManifest) {
                combined[adapter.name] = adapter.hooks.generateManifest();
            }
        }
        return combined;
    }
}
//# sourceMappingURL=ManifestRuntime.js.map