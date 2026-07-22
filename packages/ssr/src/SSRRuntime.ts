import { SSRConfig } from './types.js';
import { SSRRenderer } from './SSRRenderer.js';
import { SSRModuleGraph } from './SSRModuleGraph.js';
import { ClientManifestBuilder } from './ClientManifest.js';

export class SSRRuntime {
  private config: SSRConfig;
  private renderer = new SSRRenderer();
  private moduleGraph = new SSRModuleGraph();
  private manifestBuilder = new ClientManifestBuilder();

  constructor(config: SSRConfig = {}) {
    this.config = {
      enabled: config.enabled ?? false,
      entry: config.entry || './src/entry-server.ts',
      clientEntry: config.clientEntry || './src/main.tsx',
      streaming: config.streaming ?? true,
      external: config.external || [],
      noExternal: config.noExternal || [],
    };
  }

  isSSREnabled(): boolean {
    return this.config.enabled ?? false;
  }

  getRenderer(): SSRRenderer {
    return this.renderer;
  }

  getModuleGraph(): SSRModuleGraph {
    return this.moduleGraph;
  }

  getManifestBuilder(): ClientManifestBuilder {
    return this.manifestBuilder;
  }
}
