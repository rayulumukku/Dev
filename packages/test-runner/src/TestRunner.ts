import { TestConfig, TestRunSummary } from './types.js';
import { TestDiscovery } from './TestDiscovery.js';
import { TestScheduler } from './TestScheduler.js';
import { TestExecutor } from './TestExecutor.js';
import { TestEnvironment } from './TestEnvironment.js';

export class TestRunner {
  private static beforeTestHooks: Array<() => void> = [];
  private static afterTestHooks: Array<() => void> = [];

  static registerHooks(before?: () => void, after?: () => void): void {
    if (before) this.beforeTestHooks.push(before);
    if (after) this.afterTestHooks.push(after);
  }

  static async run(root: string, config: TestConfig = {}): Promise<TestRunSummary> {
    TestEnvironment.setupEnvironment(config.environment || 'node');

    for (const hook of this.beforeTestHooks) hook();

    const files = TestDiscovery.discoverTests(root);
    const scheduled = TestScheduler.schedule(files, { grep: config.grep });
    const summary = await TestExecutor.executeSuites(scheduled, config);

    for (const hook of this.afterTestHooks) hook();

    return summary;
  }

  static clearHooks(): void {
    this.beforeTestHooks = [];
    this.afterTestHooks = [];
  }
}
