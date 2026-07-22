import { RuntimeConfig, EdgeTarget } from './types.js';
import { Polyfills } from './Polyfills.js';

export class EdgeRuntime {
  target: EdgeTarget;

  constructor(config: RuntimeConfig = {}) {
    this.target = config.target || 'node';
    if (this.target === 'edge' && config.edge?.polyfills !== false) {
      Polyfills.applyPolyfills();
    }
  }

  isEdgeTarget(): boolean {
    return this.target === 'edge';
  }
}
