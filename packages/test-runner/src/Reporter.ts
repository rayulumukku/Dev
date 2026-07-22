import { TestRunSummary } from './types.js';

export class Reporter {
  static formatSummary(summary: TestRunSummary): string {
    const lines = [
      `⚡ Ray Native Test Runner Summary ⚡`,
      `Test Suites: ${summary.passedSuites} passed, ${summary.totalSuites} total`,
      `Tests:       ${summary.passedCount} passed, ${summary.failedCount} failed, ${summary.skippedCount} skipped`,
      `Time:        ${summary.durationMs}ms`,
    ];

    if (summary.coverage) {
      lines.push(`Coverage:    Lines ${summary.coverage.lines}% | Statements ${summary.coverage.statements}% | Functions ${summary.coverage.functions}% | Branches ${summary.coverage.branches}%`);
    }

    return lines.join('\n');
  }
}
