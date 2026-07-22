export interface AnalyzerPluginOptions {
  enabled?: boolean;
  open?: boolean;
  json?: boolean;
  html?: boolean;
  outDir?: string;
  reportFilename?: string;
  jsonFilename?: string;
  generateStatsFile?: boolean;
}

export interface ModuleMeta {
  id: string;
  name: string;
  path: string;
  size: number;
  transformedSize: number;
  gzipSize: number;
  brotliSize: number;
  isNodeModule: boolean;
  packageName?: string;
  packageVersion?: string;
  chunks: string[];
  isTreeShaken: boolean;
  retainedExports?: string[];
  prunedExports?: string[];
  deadBytesEstimate: number;
}

export interface ChunkMeta {
  name: string;
  fileName: string;
  size: number;
  gzipSize: number;
  brotliSize: number;
  isEntry: boolean;
  isDynamic: boolean;
  modules: ModuleMeta[];
  imports: string[];
  dynamicImports: string[];
}

export interface AssetMeta {
  name: string;
  size: number;
  gzipSize: number;
  type: string;
  extension: string;
}

export interface DuplicatedPackage {
  name: string;
  versions: string[];
  count: number;
  totalSize: number;
}

export interface Recommendation {
  id: string;
  title: string;
  category: 'duplicates' | 'assets' | 'packages' | 'splitting' | 'treeshaking';
  severity: 'high' | 'medium' | 'low';
  message: string;
  explanation: string;
  action: string;
}

export interface AnalysisResult {
  timestamp: number;
  bundleSize: number;
  gzipSize: number;
  brotliSize: number;
  chunkCount: number;
  moduleCount: number;
  deadCodeEstimate: number;
  treeShakenPercentage: number;
  chunks: ChunkMeta[];
  modules: ModuleMeta[];
  assets: AssetMeta[];
  duplicatedPackages: DuplicatedPackage[];
  largestModules: ModuleMeta[];
  recommendations: Recommendation[];
}
