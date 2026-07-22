import { BundlerAdapter } from './types.js';
import { RayAdapter } from './adapters/RayAdapter.js';

export class BenchmarkRunner {
  private adapters = new Map<string, BundlerAdapter>();

  constructor() {
    this.registerAdapter(new RayAdapter());
  }

  registerAdapter(adapter: BundlerAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  getAdapter(name: string): BundlerAdapter | undefined {
    return this.adapters.get(name);
  }

  hasAdapter(name: string): boolean {
    return this.adapters.has(name);
  }

  getRegisteredNames(): string[] {
    return Array.from(this.adapters.keys());
  }
}

export const globalRunner = new BenchmarkRunner();
