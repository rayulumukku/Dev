export class TaskView {
  static formatTasks(tasks: { id: string; status: string }[]): Record<string, any> {
    return {
      total: tasks.length,
      tasks,
    };
  }
}
