import { describe, it, expect, beforeEach } from 'vitest';
import {
  EventBus,
  Span,
  TraceCollector,
  MetricsCollector,
  Session,
  Exporter,
  Timeline,
  DashboardData,
} from '../../packages/observability/src/index.js';

describe('Build Observability & Telemetry Framework (PR-44)', () => {
  beforeEach(() => {
    EventBus.clear();
    TraceCollector.clear();
    MetricsCollector.clear();
  });

  it('1. should emit and receive telemetry events through EventBus', () => {
    let eventReceived = false;
    EventBus.on('cli:startup', (evt) => {
      eventReceived = true;
      expect(evt.name).toBe('cli:startup');
    });

    EventBus.emit('cli:startup', { mode: 'development' });
    expect(eventReceived).toBe(true);
  });

  it('2. should build hierarchical spans and measure durations', () => {
    const parentSpan = TraceCollector.startSpan('build:phase', undefined, { phase: 'transform' });
    const childSpan = TraceCollector.startSpan('plugin:react', parentSpan.data.id);

    const childData = TraceCollector.endSpan(childSpan, 'ok');
    const parentData = TraceCollector.endSpan(parentSpan, 'ok');

    expect(childData.parentId).toBe(parentData.id);
    expect(TraceCollector.getSpans().length).toBe(2);
  });

  it('3. should collect memory and build metric counters', () => {
    MetricsCollector.recordMetric('buildDurationMs', 350);
    MetricsCollector.recordMetric('cacheHitRatio', 0.95);

    const metrics = MetricsCollector.getMetrics();
    expect(metrics.buildDurationMs).toBe(350);
    expect(metrics.cacheHitRatio).toBe(0.95);
    expect(metrics.memoryUsageMb).toBeGreaterThan(0);
  });

  it('4. should manage unique session identifiers', () => {
    const s1 = Session.getSessionId();
    expect(typeof s1).toBe('string');

    const s2 = Session.newSession();
    expect(s2).not.toBe(s1);
  });

  it('5. should export traces as JSON and Chrome Trace Event formats', () => {
    const span = TraceCollector.startSpan('bundle:emit');
    TraceCollector.endSpan(span);

    const spans = TraceCollector.getSpans();
    const jsonExport = Exporter.exportJSON(spans);
    expect(jsonExport).toContain('bundle:emit');

    const chromeExport = Exporter.exportChromeTrace(spans);
    expect(chromeExport).toContain('traceEvents');
    expect(chromeExport).toContain('bundle:emit');
  });

  it('6. should format execution timeline and generate dashboard payload', () => {
    const span = TraceCollector.startSpan('transform:vue');
    TraceCollector.endSpan(span);

    const timelineText = Timeline.formatTimeline(TraceCollector.getSpans());
    expect(timelineText).toContain('Ray Execution Span Timeline');
    expect(timelineText).toContain('transform:vue');

    const payload = DashboardData.getDashboardPayload();
    expect(payload.sessionId).toBeDefined();
    expect(payload.metrics).toBeDefined();
    expect(payload.spans.length).toBe(1);
  });
});
