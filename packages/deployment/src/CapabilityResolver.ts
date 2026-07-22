import { DeploymentCapabilities } from './types.js';

export class CapabilityResolver {
  static resolveCapabilities(caps: DeploymentCapabilities, required: Partial<DeploymentCapabilities>): boolean {
    for (const [key, value] of Object.entries(required)) {
      if (value && !(caps as any)[key]) {
        return false;
      }
    }
    return true;
  }
}
