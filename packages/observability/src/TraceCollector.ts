import { Span } from './Span.js';
import { SpanData } from './types.js';

export class TraceCollector {
  private static finishedSpans: SpanData[] = [];
  private static activeSpans = new Map<string, Span>();

  static startSpan(name: string, parentId?: string, metadata?: Record<string, any>): Span {
    const span = new Span(name, parentId, metadata);
    this.activeSpans.set(span.data.id, span);
    return span;
  }

  static endSpan(span: Span, status: 'ok' | 'error' = 'ok'): SpanData {
    const finished = span.end(status);
    this.activeSpans.delete(span.data.id);
    this.finishedSpans.push(finished);
    return finished;
  }

  static getSpans(): SpanData[] {
    return this.finishedSpans;
  }

  static clear(): void {
    this.finishedSpans = [];
    this.activeSpans.clear();
  }
}
