import { RuntimeRegistry } from './RuntimeRegistry.js';
export class SSRRuntime {
    static async renderModule(module, props = {}) {
        const adapters = RuntimeRegistry.getAdapters();
        for (const adapter of adapters) {
            if (adapter.capabilities.ssr && adapter.hooks?.renderSSR) {
                return await adapter.hooks.renderSSR(module, props);
            }
        }
        return { html: '<div id="app"></div>', css: '' };
    }
}
//# sourceMappingURL=SSRRuntime.js.map