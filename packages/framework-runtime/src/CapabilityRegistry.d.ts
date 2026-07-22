import { FrameworkAdapter, FrameworkCapabilities } from './types.js';
export declare class CapabilityRegistry {
    static validateCapabilities(adapter: FrameworkAdapter, required: (keyof FrameworkCapabilities)[]): boolean;
    static getSupportedCapabilities(adapter: FrameworkAdapter): string[];
}
//# sourceMappingURL=CapabilityRegistry.d.ts.map