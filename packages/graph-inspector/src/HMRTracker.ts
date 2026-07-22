import { HMRUpdateEvent } from './types.js';

export class HMRTracker {
  private events: HMRUpdateEvent[] = [];

  recordEvent(editedFile: string, invalidatedModules: string[]): HMRUpdateEvent {
    const event: HMRUpdateEvent = {
      editedFile,
      invalidatedModules,
      timestamp: Date.now(),
    };
    this.events.push(event);
    return event;
  }

  getEvents(): HMRUpdateEvent[] {
    return this.events;
  }

  clear(): void {
    this.events = [];
  }
}
