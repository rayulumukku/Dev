import { SpanData } from './types.js';

export class Span {
  data: SpanData;

  constructor(name: string, parentId?: string, metadata?: Record<string, any>) {
    this.data = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      parentId,
      startTime: Date.now(),
      status: 'ok',
      metadata,
    };
  }

  end(status: 'ok' | 'error' = 'ok'): SpanData {
    this.data.endTime = Date.now();
    this.data.durationMs = this.data.endTime - this.data.startTime;
    this.data.status = status;
    return this.data;
  }
}
