import { TaskExecution, ExecutionPlanResult } from './types.js';
import { TaskCache } from './TaskCache.js';

export class TaskRunner {
  private static beforeTaskHooks: Array<(taskId: string) => void> = [];
  private static afterTaskHooks: Array<(taskId: string, result: TaskExecution) => void> = [];

  static registerHooks(
    before?: (taskId: string) => void,
    after?: (taskId: string, result: TaskExecution) => void
  ): void {
    if (before) this.beforeTaskHooks.push(before);
    if (after) this.afterTaskHooks.push(after);
  }

  static async runTasks(tasks: TaskExecution[], options: { concurrency?: number; useCache?: boolean } = {}): Promise<ExecutionPlanResult> {
    const start = Date.now();
    let hits = 0;
    let misses = 0;

    for (const t of tasks) {
      if (options.useCache !== false && TaskCache.isCached(t.id)) {
        t.status = 'cached';
        t.durationMs = 0;
        hits++;
        continue;
      }

      t.status = 'running';
      for (const hook of this.beforeTaskHooks) hook(t.id);

      const taskStart = Date.now();
      // Simulate task execution
      t.status = 'completed';
      t.durationMs = Date.now() - taskStart;
      misses++;

      if (options.useCache !== false) {
        TaskCache.markCached(t.id);
      }

      for (const hook of this.afterTaskHooks) hook(t.id, t);
    }

    return {
      tasks,
      durationMs: Date.now() - start,
      cacheHits: hits,
      cacheMisses: misses,
    };
  }

  static clearHooks(): void {
    this.beforeTaskHooks = [];
    this.afterTaskHooks = [];
  }
}
