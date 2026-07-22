export interface AdapterContext {
  projectRoot: string;
  grep?: string;
  updateSnapshots?: boolean;
}

export interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  durationMs: number;
  error?: string;
}

export interface TestSuiteResult {
  filepath: string;
  tests: TestResult[];
  durationMs: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface TestAdapter {
  name: string;
  executeSuite(filepath: string, ctx?: AdapterContext): Promise<TestSuiteResult>;
}
