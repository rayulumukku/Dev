export interface InspectorConfig {
  port?: number;
  host?: string;
  open?: boolean;
}

export interface InspectorPanel {
  id: string;
  title: string;
  data: any;
}

export interface InspectorState {
  session: string;
  moduleGraph: { nodes: any[]; edges: any[] };
  plugins: { name: string; durationMs: number }[];
  cache: { hits: number; misses: number; hitRate: number };
  tasks: { id: string; status: string }[];
  diagnostics: any[];
  customPanels: Record<string, InspectorPanel>;
}

export interface WSMessage {
  type: string;
  data: any;
}
