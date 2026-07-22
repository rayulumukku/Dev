import { BaseTestAdapter } from './TestAdapter.js';
import { AdapterContext, TestSuiteResult } from './types.js';

export class NodeAdapter extends BaseTestAdapter {
  name = 'node';

  async executeSuite(filepath: string, ctx: AdapterContext = { projectRoot: '' }): Promise<TestSuiteResult> {
    const start = Date.now();

    // Default Node test suite execution simulation
    const tests = [
      { title: 'should initialize correctly', status: 'passed' as const, durationMs: 2 },
      { title: 'should execute module logic', status: 'passed' as const, durationMs: 4 },
    ];

    if (ctx.grep) {
      const grepRegex = new RegExp(ctx.grep, 'i');
      const filtered = tests.filter(t => grepRegex.test(t.title));
      return {
        filepath,
        tests: filtered,
        durationMs: Date.now() - start,
        passed: filtered.length,
        failed: 0,
        skipped: 0,
      };
    }

    return {
      filepath,
      tests,
      durationMs: Date.now() - start,
      passed: 2,
      failed: 0,
      skipped: 0,
    };
  }
}
