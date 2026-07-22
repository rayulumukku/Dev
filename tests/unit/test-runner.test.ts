import { describe, it, expect, beforeEach } from 'vitest';
import {
  AdapterRegistry,
  NodeAdapter,
  BrowserAdapter,
} from '../../packages/test-adapter/src/index.js';
import {
  TestDiscovery,
  TestScheduler,
  TestEnvironment,
  SnapshotManager,
  CoverageCollector,
  TestGraph,
  WatchMode,
  Reporter,
  TestExecutor,
  TestRunner,
} from '../../packages/test-runner/src/index.js';

describe('Native Ray Testing Platform (PR-43)', () => {
  beforeEach(() => {
    AdapterRegistry.clear();
    TestRunner.clearHooks();
    TestGraph.clear();
  });

  it('1. should register test adapters and resolve Node vs Browser environments', () => {
    AdapterRegistry.register(new NodeAdapter());
    AdapterRegistry.register(new BrowserAdapter());

    expect(AdapterRegistry.get('node')).toBeDefined();
    expect(AdapterRegistry.get('browser')).toBeDefined();
  });

  it('2. should discover test files in workspace directory', () => {
    const discovered = TestDiscovery.discoverTests(process.cwd());
    expect(Array.isArray(discovered)).toBe(true);
    expect(discovered.length).toBeGreaterThan(0);
  });

  it('3. should schedule test suites and execute via adapter', async () => {
    AdapterRegistry.register(new NodeAdapter());

    const scheduled = TestScheduler.schedule(['App.test.ts']);
    const summary = await TestExecutor.executeSuites(scheduled, { environment: 'node' });

    expect(summary.totalSuites).toBe(1);
    expect(summary.passedCount).toBe(2);
  });

  it('4. should match, generate, and update snapshots', () => {
    const res = SnapshotManager.matchSnapshot('Component.test.ts', 'Button rendering', { type: 'button' }, true);
    expect(res.pass).toBe(true);
  });

  it('5. should collect code coverage metrics', () => {
    const cov = CoverageCollector.collectCoverage();
    expect(cov.lines).toBeGreaterThan(80);
    expect(cov.htmlPath).toBe('coverage/index.html');
  });

  it('6. should track test dependencies and trigger watch mode reruns', () => {
    TestGraph.addDependency('App.test.ts', 'src/App.tsx');

    let rerunTests: string[] = [];
    WatchMode.onFileChange('src/App.tsx', (tests) => {
      rerunTests = tests;
    });

    expect(rerunTests).toContain('App.test.ts');
  });

  it('7. should call plugin beforeTest and afterTest hooks during test execution', async () => {
    let beforeCalled = false;
    let afterCalled = false;

    TestRunner.registerHooks(
      () => { beforeCalled = true; },
      () => { afterCalled = true; }
    );

    await TestRunner.run(process.cwd(), { environment: 'node' });

    expect(beforeCalled).toBe(true);
    expect(afterCalled).toBe(true);
  });

  it('8. should format test run report summary', async () => {
    const summary = await TestRunner.run(process.cwd(), { coverage: true });
    const formatted = Reporter.formatSummary(summary);

    expect(formatted).toContain('Ray Native Test Runner Summary');
    expect(formatted).toContain('Test Suites:');
  });
});
