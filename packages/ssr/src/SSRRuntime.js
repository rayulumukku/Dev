import { SSRRenderer } from './SSRRenderer.js';
import { SSRModuleGraph } from './SSRModuleGraph.js';
import { ClientManifestBuilder } from './ClientManifest.js';

export class SSRRuntime {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled ?? false,
      entry: config.entry || './src/entry-server.ts',
      clientEntry: config.clientEntry || './src/main.tsx',
      streaming: config.streaming ?? true,
      external: config.external || [],
      noExternal: config.noExternal || [],
    };
    this.renderer = new SSRRenderer();
    this.moduleGraph = new SSRModuleGraph();
    this.manifestBuilder = new ClientManifestBuilder();
  }

  isSSREnabled() {
    return this.config.enabled ?? false;
  }

  getRenderer() {
    return this.renderer;
  }

  getModuleGraph() {
    return this.moduleGraph;
  }

  getManifestBuilder() {
    return this.manifestBuilder;
  }
}
