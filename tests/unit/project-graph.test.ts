import { describe, it, expect, beforeEach } from 'vitest';
import {
  ProjectScanner,
  DependencyAnalyzer,
  ProjectGraph,
  TaskScheduler,
  TaskRunner,
  TaskCache,
  AffectedProjects,
  ExecutionPlan,
  TaskManifest,
} from '../../packages/project-graph/src/index.js';

describe('Project Graph & Task Orchestration Engine (PR-42)', () => {
  beforeEach(() => {
    TaskCache.clear();
    TaskRunner.clearHooks();
  });

  it('1. should discover workspace projects and classify types', () => {
    const projects = ProjectScanner.scanWorkspace(process.cwd());
    expect(Array.isArray(projects)).toBe(true);
    expect(projects.length).toBeGreaterThan(0);
  });

  it('2. should analyze inter-project dependency edges and topological order', () => {
    const graph = new ProjectGraph([
      { name: '@pkg/ui', root: 'packages/ui', type: 'lib', dependencies: [] },
      { name: '@pkg/web', root: 'apps/web', type: 'app', dependencies: ['@pkg/ui'] },
    ]);

    expect(graph.getDependencies('@pkg/web')).toContain('@pkg/ui');

    const sorted = graph.toSortedOrder();
    expect(sorted.indexOf('@pkg/ui')).toBeLessThan(sorted.indexOf('@pkg/web'));
  });

  it('3. should schedule tasks in dependency order', () => {
    const graph = new ProjectGraph([
      { name: 'ui', root: 'packages/ui', type: 'lib', dependencies: [] },
      { name: 'web', root: 'apps/web', type: 'app', dependencies: ['ui'] },
    ]);

    const schedule = TaskScheduler.createSchedule(graph, 'build');
    expect(schedule.length).toBe(2);
    expect(schedule[0].project).toBe('ui');
    expect(schedule[1].project).toBe('web');
  });

  it('4. should execute tasks and reuse cached execution outputs', async () => {
    const graph = new ProjectGraph([
      { name: 'pkg-a', root: 'packages/a', type: 'package', dependencies: [] },
    ]);

    const schedule1 = TaskScheduler.createSchedule(graph, 'build');
    const res1 = await TaskRunner.runTasks(schedule1, { useCache: true });

    expect(res1.cacheMisses).toBe(1);
    expect(res1.cacheHits).toBe(0);

    const schedule2 = TaskScheduler.createSchedule(graph, 'build');
    const res2 = await TaskRunner.runTasks(schedule2, { useCache: true });

    expect(res2.cacheHits).toBe(1);
  });

  it('5. should compute affected projects from modified source files', () => {
    const graph = new ProjectGraph([
      { name: 'ui', root: 'packages/ui', type: 'lib', dependencies: [] },
      { name: 'web', root: 'apps/web', type: 'app', dependencies: ['ui'] },
      { name: 'docs', root: 'apps/docs', type: 'app', dependencies: [] },
    ]);

    const affected = AffectedProjects.getAffectedProjects(graph, ['packages/ui/Button.tsx']);
    expect(affected).toContain('ui');
    expect(affected).toContain('web');
    expect(affected).not.toContain('docs');
  });

  it('6. should call plugin beforeTask and afterTask hooks during execution', async () => {
    let beforeCalled = false;
    let afterCalled = false;

    TaskRunner.registerHooks(
      () => { beforeCalled = true; },
      () => { afterCalled = true; }
    );

    const graph = new ProjectGraph([
      { name: 'core-lib', root: 'libs/core', type: 'lib', dependencies: [] },
    ]);

    const schedule = TaskScheduler.createSchedule(graph, 'test');
    await TaskRunner.runTasks(schedule, { useCache: false });

    expect(beforeCalled).toBe(true);
    expect(afterCalled).toBe(true);
  });

  it('7. should generate task manifest and format execution plan report', async () => {
    const graph = new ProjectGraph([
      { name: 'app', root: 'apps/app', type: 'app', dependencies: [] },
    ]);

    const manifest = TaskManifest.generateManifest(graph);
    expect(manifest['app']).toBeDefined();

    const schedule = TaskScheduler.createSchedule(graph, 'build');
    const result = await TaskRunner.runTasks(schedule, { useCache: false });
    const report = ExecutionPlan.formatReport(result);

    expect(report).toContain('Ray Workspace Task Execution Timeline');
    expect(report).toContain('app:build');
  });
});
