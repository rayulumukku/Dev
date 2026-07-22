export class BenchmarkRunner {
  constructor() {
    this.adapters = new Map();
  }

  registerAdapter(adapter) {
    this.adapters.set(adapter.name, adapter);
  }

  getAdapter(name) {
    return this.adapters.get(name);
  }

  hasAdapter(name) {
    return this.adapters.has(name);
  }

  getRegisteredNames() {
    return Array.from(this.adapters.keys());
  }
}

export const globalRunner = new BenchmarkRunner();
