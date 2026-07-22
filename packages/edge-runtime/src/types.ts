export type EdgeTarget = 'node' | 'edge';

export interface RuntimeConfig {
  target?: EdgeTarget;
  edge?: {
    enabled?: boolean;
    polyfills?: boolean;
  };
}

export interface EdgeCapabilities {
  streams: boolean;
  fetch: boolean;
  webCrypto: boolean;
  unsupportedNodeModules: string[];
}

export interface EdgeManifest {
  target: EdgeTarget;
  entry: string;
  capabilities: EdgeCapabilities;
  assets: string[];
}
