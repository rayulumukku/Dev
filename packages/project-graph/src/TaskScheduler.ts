import { ProjectGraph } from './ProjectGraph.js';
import { TaskExecution } from './types.js';

export class TaskScheduler {
  static createSchedule(graph: ProjectGraph, taskName: string, targetProject?: string): TaskExecution[] {
    const order = graph.toSortedOrder();
    const filtered = targetProject ? order.filter(p => p === targetProject || graph.getDependencies(targetProject).includes(p)) : order;

    return filtered.map(proj => ({
      id: `${proj}:${taskName}`,
      project: proj,
      task: taskName,
      status: 'pending',
      durationMs: 0,
    }));
  }
}
