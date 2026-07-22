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
declare class RayStudioRegistry {
    panels: StudioPanel[];
    timeline: StudioTimelineEvent[];
    metrics: Record<string, any>;
    addPanel(name: string, config: any): void;
    addTimeline(event: StudioTimelineEvent): void;
    addMetric(name: string, value: any): void;
    getSnapshot(): {
        panels: StudioPanel[];
        timeline: StudioTimelineEvent[];
        metrics: Record<string, any>;
    };
}
export declare const studio: RayStudioRegistry;
export {};
//# sourceMappingURL=studioApi.d.ts.map