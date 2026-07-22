import { RuntimeRegistry } from './RuntimeRegistry.js';
export class HMRRuntime {
    static notifyHMRUpdate(file) {
        const adapters = RuntimeRegistry.resolveActiveAdapters(file);
        for (const adapter of adapters) {
            if (adapter.capabilities.hmr && adapter.hooks?.onHMRUpdate) {
                adapter.hooks.onHMRUpdate(file);
            }
        }
    }
}
//# sourceMappingURL=HMRRuntime.js.map