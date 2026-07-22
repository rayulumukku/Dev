import { FrameworkAdapter, FrameworkCapabilities } from './types.js';

export class CapabilityRegistry {
  static validateCapabilities(adapter: FrameworkAdapter, required: (keyof FrameworkCapabilities)[]): boolean {
    for (const req of required) {
      if (!adapter.capabilities[req]) {
        return false;
      }
    }
    return true;
  }

  static getSupportedCapabilities(adapter: FrameworkAdapter): string[] {
    const active: string[] = [];
    for (const [key, value] of Object.entries(adapter.capabilities)) {
      if (value) active.push(key);
    }
    return active;
  }
}
