export class CapabilityRegistry {
    static validateCapabilities(adapter, required) {
        for (const req of required) {
            if (!adapter.capabilities[req]) {
                return false;
            }
        }
        return true;
    }
    static getSupportedCapabilities(adapter) {
        const active = [];
        for (const [key, value] of Object.entries(adapter.capabilities)) {
            if (value)
                active.push(key);
        }
        return active;
    }
}
//# sourceMappingURL=CapabilityRegistry.js.map