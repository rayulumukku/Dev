export type ProjectType = 'app' | 'lib' | 'package' | 'example' | 'tool';

export interface ProjectNode {
  name: string;
  root: string;
  type: ProjectType;
  dependencies: string[];
  implicitDependencies?: string[];
  tasks?: Record<string, TaskDefinition>;
}

export interface TaskDefinition {
  name: string;
  command?: string;
  dependencies?: string[];
  cacheable?: boolean;
}

export interface TaskExecution {
  id: string; // e.g. "web:build"
  project: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'cached' | 'failed';
  durationMs: number;
  error?: string;
}

export interface ExecutionPlanResult {
  tasks: TaskExecution[];
  durationMs: number;
  cacheHits: number;
  cacheMisses: number;
}
