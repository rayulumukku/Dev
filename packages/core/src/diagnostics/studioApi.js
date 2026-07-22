class RayStudioRegistry {
    panels = [];
    timeline = [];
    metrics = {};
    addPanel(name, config) {
        this.panels.push({ name, config });
        console.log(`[Ray Studio API] Custom panel added: "${name}"`);
    }
    addTimeline(event) {
        this.timeline.push(event);
    }
    addMetric(name, value) {
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
globalThis.__ray_studio = studioRegistry;
export const studio = studioRegistry;
//# sourceMappingURL=studioApi.js.map