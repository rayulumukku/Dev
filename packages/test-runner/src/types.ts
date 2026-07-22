export interface TestConfig {
  include?: string[];
  environment?: 'node' | 'browser' | string;
  coverage?: boolean;
  watch?: boolean;
  updateSnapshots?: boolean;
  grep?: string;
  reporter?: string;
}

export interface CoverageReport {
  lines: number;
  statements: number;
  functions: number;
  branches: number;
  htmlPath?: string;
  jsonPath?: string;
  lcovPath?: string;
}

export interface TestRunSummary {
  totalSuites: number;
  passedSuites: number;
  failedSuites: number;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  durationMs: number;
  coverage?: CoverageReport;
}
