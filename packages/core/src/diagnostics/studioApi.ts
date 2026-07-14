// Ray Studio Telemetry Public API
export interface StudioPanel {
  name: string;
  config: any;
}

export interface StudioTimelineEvent {
  type: string;
  timestamp: number;
  message: string;
  data?: any;
}

class RayStudioRegistry {
  panels: StudioPanel[] = [];
  timeline: StudioTimelineEvent[] = [];
  metrics: Record<string, any> = {};

  addPanel(name: string, config: any) {
    this.panels.push({ name, config });
    console.log(`[Ray Studio API] Custom panel added: "${name}"`);
  }

  addTimeline(event: StudioTimelineEvent) {
    this.timeline.push(event);
  }

  addMetric(name: string, value: any) {
    this.metrics[name] = value;
  }

  getSnapshot() {
    return {
      panels: this.panels,
      timeline: this.timeline,
      metrics: this.metrics,
    };
  }
}

// Bind to global namespace
const studioRegistry = new RayStudioRegistry();
(globalThis as any).__ray_studio = studioRegistry;

export const studio = studioRegistry;
