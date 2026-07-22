export type ModuleState = 'unchanged' | 'affected' | 'invalidated' | 'rebuilt' | 'reused';

export type InvalidationReason =
  | 'file-changed'
  | 'dep-changed'
  | 'config-changed'
  | 'env-changed'
  | 'plugin-changed'
  | 'version-changed'
  | 'forced-clean'
  | 'validation-mismatch'
  | 'missing-artifact';

export interface IncrementalBuildOptions {
  enabled?: boolean;
  clean?: boolean;
  validateOutputs?: boolean;
  cacheDir?: string;
  outDir?: string;
  projectRoot?: string;
  rayVersion?: string;
  configHash?: string;
  envHash?: string;
  pluginsHash?: string;
}

export interface FileManifest {
  filePath: string;
  hash: string;
  mtime: number;
  deps: string[];
}

export interface BuildManifest {
  version: string;
  timestamp: number;
  configHash: string;
  envHash: string;
  pluginsHash: string;
  files: Record<string, FileManifest>;
  artifacts: Record<string, { hash: string; size: number; path: string }>;
  chunkGraphHash: string;
}

export interface PlannedModule {
  filePath: string;
  state: ModuleState;
  reason?: InvalidationReason;
  hash: string;
}

export interface BuildPlan {
  modules: Map<string, PlannedModule>;
  reusedCount: number;
  rebuiltCount: number;
  invalidatedCount: number;
  totalCount: number;
  requiresCleanFallback: boolean;
  reason?: string;
}

export interface IncrementalMetrics {
  reusedArtifacts: number;
  rebuiltArtifacts: number;
  cacheHitRatio: number;
  timeSavedMs: number;
  invalidationReasons: Record<string, number>;
}
