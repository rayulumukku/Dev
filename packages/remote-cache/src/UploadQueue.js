export class UploadQueue {
  constructor() {
    this.queue = [];
    this.active = false;
    this.drainResolvers = [];
  }

  add(task) {
    this.queue.push(task);
    this.process();
  }

  async drain() {
    if (!this.active && this.queue.length === 0) return;
    return new Promise((resolve) => {
      this.drainResolvers.push(resolve);
    });
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
    const resolvers = this.drainResolvers.slice();
    this.drainResolvers = [];
    for (const r of resolvers) {
      r();
    }
  }
}
