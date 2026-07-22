export class UploadQueue {
  constructor() {
    this.queue = [];
    this.active = false;
  }

  add(task) {
    this.queue.push(task);
    this.process();
  }

  async process() {
    if (this.active || this.queue.length === 0) return;
    this.active = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        try {
          await task();
        } catch {
          // ignore upload errors in background queue
        }
      }
    }

    this.active = false;
  }
}
