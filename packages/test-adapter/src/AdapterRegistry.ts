import { TestAdapter } from './types.js';

export class AdapterRegistry {
  private static adapters = new Map<string, TestAdapter>();

  static register(adapter: TestAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  static get(name: string): TestAdapter | undefined {
    return this.adapters.get(name);
  }

  static getAll(): TestAdapter[] {
    return Array.from(this.adapters.values());
  }

  static clear(): void {
    this.adapters.clear();
  }
}
