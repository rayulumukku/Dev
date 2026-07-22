export class HMRTracker {
  constructor() {
    this.events = [];
  }

  recordEvent(editedFile, invalidatedModules) {
    const event = {
      editedFile,
      invalidatedModules,
      timestamp: Date.now(),
    };
    this.events.push(event);
    return event;
  }

  getEvents() {
    return this.events;
  }

  clear() {
    this.events = [];
  }
}
