import { TaskExecution } from './types.js';

export class TaskPipeline {
  private tasks: TaskExecution[] = [];

  constructor(tasks: TaskExecution[]) {
    this.tasks = tasks;
  }

  getTasks(): TaskExecution[] {
    return this.tasks;
  }
}
