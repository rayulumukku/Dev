export class UploadQueue {
  private queue: Array<() => Promise<void>> = [];
  private active = false;
  private drainResolvers: Array<() => void> = [];

  add(task: () => Promise<void>): void {
    this.queue.push(task);
    this.process();
  }

  async drain(): Promise<void> {
    if (!this.active && this.queue.length === 0) return;
    return new Promise<void>((resolve) => {
      this.drainResolvers.push(resolve);
    });
  }

  private async process(): Promise<void> {
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
