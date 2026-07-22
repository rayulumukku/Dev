import { SpanData } from './types.js';

export class Timeline {
  static formatTimeline(spans: SpanData[]): string {
    const lines = [`⚡ Ray Execution Span Timeline ⚡`];
    for (const s of spans) {
      lines.push(`  [${s.status.toUpperCase()}] ${s.name} (${s.durationMs || 0}ms)`);
    }
    return lines.join('\n');
  }
}
