import { AdapterRegistry, DefaultAdapter } from '@ray/test-adapter';
import { TestConfig, TestRunSummary } from './types.js';
import { CoverageCollector } from './CoverageCollector.js';

export class TestExecutor {
  static async executeSuites(files: string[], config: TestConfig = {}): Promise<TestRunSummary> {
    const start = Date.now();
    const adapterName = config.environment || 'default';
    let adapter = AdapterRegistry.get(adapterName);

    if (!adapter) {
      adapter = new DefaultAdapter();
    }

    let totalTests = 0;
    let passedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let passedSuites = 0;

    for (const f of files) {
      const res = await adapter.executeSuite(f, {
        projectRoot: process.cwd(),
        grep: config.grep,
        updateSnapshots: config.updateSnapshots,
      });

      totalTests += res.tests.length;
      passedCount += res.passed;
      failedCount += res.failed;
      skippedCount += res.skipped;
      if (res.failed === 0) passedSuites++;
    }

    const coverage = config.coverage ? CoverageCollector.collectCoverage() : undefined;

    return {
      totalSuites: files.length,
      passedSuites,
      failedSuites: files.length - passedSuites,
      totalTests,
      passedCount,
      failedCount,
      skippedCount,
      durationMs: Date.now() - start,
      coverage,
    };
  }
}
