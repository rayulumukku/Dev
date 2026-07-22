export interface CacheConfig {
  dir?: string;
  enabled?: boolean;
  maxAgeDays?: number;
  maxSizeMB?: number;
}

export interface CacheKeyInput {
  filePath: string;
  code: string;
  rayVersion?: string;
  pluginConfig?: any;
  buildMode?: string;
  env?: Record<string, string>;
  dependencies?: string[];
}

export interface CacheEntry {
  hash: string;
  filePath: string;
  transformedCode: string;
  map?: any;
  metadata?: Record<string, any>;
  timestamp: number;
  accessCount: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  totalEntries: number;
  cacheSizeBytes: number;
  oldestEntryTimestamp?: number;
  hitRate: number;
}
