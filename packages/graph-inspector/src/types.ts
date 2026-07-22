export type NodeType = 'js' | 'ts' | 'react' | 'vue' | 'css' | 'asset' | 'workspace';

export interface InspectorNode {
  id: string;
  label: string;
  type: NodeType;
  sizeBytes?: number;
  transformTimeMs?: number;
  isEntry?: boolean;
}

export interface InspectorEdge {
  source: string;
  target: string;
  isDynamic?: boolean;
}

export interface CircularCycle {
  cycle: string[];
  suggestedBreakPoint: string;
}

export interface HMRUpdateEvent {
  editedFile: string;
  invalidatedModules: string[];
  timestamp: number;
}

export interface PluginExecutionMetric {
  pluginName: string;
  transformCount: number;
  totalTimeMs: number;
}

export interface InspectorServerOptions {
  port?: number;
  host?: string;
  open?: boolean;
}
