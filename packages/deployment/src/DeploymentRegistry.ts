import { DeploymentAdapter } from './types.js';

export class DeploymentRegistry {
  private static adapters = new Map<string, DeploymentAdapter>();

  static register(adapter: DeploymentAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  static get(name: string): DeploymentAdapter | undefined {
    return this.adapters.get(name);
  }

  static getAll(): DeploymentAdapter[] {
    return Array.from(this.adapters.values());
  }

  static clear(): void {
    this.adapters.clear();
  }
}
