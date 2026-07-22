import { EdgeCapabilities, EdgeManifest, EdgeTarget } from './types.js';

export class Manifest {
  static generateManifest(target: EdgeTarget, entry: string, capabilities: EdgeCapabilities, assets: string[] = []): EdgeManifest {
    return {
      target,
      entry,
      capabilities,
      assets,
    };
  }
}
