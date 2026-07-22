import { SpanData, ChromeTraceEvent } from './types.js';

export class Exporter {
  static exportJSON(spans: SpanData[]): string {
    return JSON.stringify(spans, null, 2);
  }

  static exportChromeTrace(spans: SpanData[]): string {
    const events: ChromeTraceEvent[] = spans.map(s => ({
      name: s.name,
      cat: 'ray.build',
      ph: 'X',
      ts: s.startTime * 1000,
      dur: (s.durationMs || 0) * 1000,
      pid: 1,
      tid: 1,
      args: s.metadata || {},
    }));

    return JSON.stringify({ traceEvents: events }, null, 2);
  }
}
