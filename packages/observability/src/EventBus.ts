import { TelemetryEvent } from './types.js';

export class EventBus {
  private static listeners = new Map<string, Array<(event: TelemetryEvent) => void>>();

  static emit(name: string, payload?: any): void {
    const event: TelemetryEvent = { name, timestamp: Date.now(), payload };
    const callbacks = this.listeners.get(name) || [];
    for (const cb of callbacks) {
      cb(event);
    }
  }

  static on(name: string, callback: (event: TelemetryEvent) => void): void {
    if (!this.listeners.has(name)) {
      this.listeners.set(name, []);
    }
    this.listeners.get(name)!.push(callback);
  }

  static clear(): void {
    this.listeners.clear();
  }
}
