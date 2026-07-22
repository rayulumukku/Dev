import { RuntimeRegistry } from './RuntimeRegistry.js';
export function defineFramework(config) {
    RuntimeRegistry.registerAdapter(config);
    return config;
}
//# sourceMappingURL=FrameworkAdapter.js.map