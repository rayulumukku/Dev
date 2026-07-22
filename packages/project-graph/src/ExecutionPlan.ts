import { ExecutionPlanResult } from './types.js';

export class ExecutionPlan {
  static formatReport(result: ExecutionPlanResult): string {
    const lines = [
      `⚡ Ray Workspace Task Execution Timeline ⚡`,
      `Total Tasks: ${result.tasks.length}`,
      `Cache Hits:  ${result.cacheHits}`,
      `Cache Misses:${result.cacheMisses}`,
      `Duration:    ${result.durationMs}ms`,
      `--- Tasks ---`,
    ];

    for (const t of result.tasks) {
      lines.push(`  [${t.status.toUpperCase()}] ${t.id} (${t.durationMs}ms)`);
    }

    return lines.join('\n');
  }
}
