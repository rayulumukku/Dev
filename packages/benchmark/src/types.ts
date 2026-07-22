export type ProjectScale = 'small' | 'medium' | 'large' | 'huge';
export type OutputFormat = 'json' | 'markdown' | 'html';

export interface BenchmarkOptions {
  bundlers: string[];
  projectScale: ProjectScale;
  runs: number;
  outputFormat: OutputFormat;
  outDir?: string;
  seed?: number;
}

export interface GeneratorOptions {
  projectName: string;
  targetDir: string;
  scale: ProjectScale;
  seed?: number;
  framework?: 'react' | 'vue' | 'vanilla';
}

export interface RawMetrics {
  coldStartTime: number;
  compileTime: number;
  firstPageReady: number;
  buildTime: number;
  peakMemoryMB: number;
  cpuTimeMs: number;
  bundleSizeBytes: number;
}

export interface SummaryStatistics {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  p95: number;
}

export interface MetricSummaries {
  coldStartTime: SummaryStatistics;
  compileTime: SummaryStatistics;
  firstPageReady: SummaryStatistics;
  buildTime: SummaryStatistics;
  peakMemoryMB: SummaryStatistics;
  cpuTimeMs: SummaryStatistics;
  bundleSizeBytes: SummaryStatistics;
}

export interface EnvironmentInfo {
  os: string;
  cpu: string;
  totalRamGB: number;
  nodeVersion: string;
  packageManager: string;
  rayVersion: string;
  benchmarkVersion: string;
}

export interface BundlerAdapter {
  name: string;
  version: string;
  setup(workspaceDir: string): Promise<void>;
  runBuild(workspaceDir: string): Promise<RawMetrics>;
  cleanup?(workspaceDir: string): Promise<void>;
}

export interface BenchmarkReport {
  environment: EnvironmentInfo;
  settings: BenchmarkOptions;
  results: Record<string, {
    raw: RawMetrics[];
    summary: MetricSummaries;
  }>;
  timestamp: string;
}
