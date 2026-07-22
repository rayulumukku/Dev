import { TraceCollector } from './TraceCollector.js';
import { MetricsCollector } from './MetricsCollector.js';
import { Session } from './Session.js';

export class DashboardData {
  static getDashboardPayload(): Record<string, any> {
    return {
      sessionId: Session.getSessionId(),
      timestamp: Date.now(),
      metrics: MetricsCollector.getMetrics(),
      spans: TraceCollector.getSpans(),
    };
  }
}
