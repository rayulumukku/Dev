export interface ObservabilityConfig {
  enabled?: boolean;
  recordTimings?: boolean;
  recordMemory?: boolean;
  recordCache?: boolean;
  exporter?: 'json' | 'chrome-trace' | string;
}

export interface SpanData {
  id: string;
  name: string;
  parentId?: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: 'ok' | 'error';
  metadata?: Record<string, any>;
}

export interface TelemetryEvent {
  name: string;
  timestamp: number;
  payload?: any;
}

export interface MetricsData {
  buildDurationMs: number;
  transformDurationMs: number;
  cacheHitRatio: number;
  memoryUsageMb: number;
  hmrLatencyMs?: number;
}

export interface ChromeTraceEvent {
  name: string;
  cat: string;
  ph: string;
  ts: number;
  dur?: number;
  pid: number;
  tid: number;
  args?: Record<string, any>;
}
