export interface RemoteCacheConfig {
  enabled?: boolean;
  url?: string;
  token?: string;
  namespace?: string;
  timeoutMs?: number;
}

export interface RemoteCacheArtifact {
  hash: string;
  namespace?: string;
  data: string; // JSON stringified or raw code
  map?: any;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface RemoteCacheStats {
  localHits: number;
  remoteHits: number;
  misses: number;
  uploads: number;
  downloads: number;
  transferredBytes: number;
  hitRate: number;
}
