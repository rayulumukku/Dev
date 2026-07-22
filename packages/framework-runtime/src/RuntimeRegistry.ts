import { FrameworkAdapter } from './types.js';

export class RuntimeRegistry {
  private static adapters = new Map<string, FrameworkAdapter>();

  static registerAdapter(adapter: FrameworkAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  static getAdapter(name: string): FrameworkAdapter | undefined {
    return this.adapters.get(name);
  }

  static getAdapters(): FrameworkAdapter[] {
    return Array.from(this.adapters.values());
  }

  static resolveActiveAdapters(id?: string): FrameworkAdapter[] {
    if (!id) return this.getAdapters();
    const matched = this.getAdapters().filter(adapter => {
      if (id.endsWith('.svelte') && adapter.name.includes('svelte')) return true;
      if ((id.endsWith('.jsx') || id.endsWith('.tsx') || id.endsWith('.solid.tsx')) && adapter.name.includes('solid')) return true;
      if ((id.endsWith('.ts') || id.endsWith('.html')) && adapter.name.includes('angular')) return true;
      if (id.endsWith('.vue') && adapter.name.includes('vue')) return true;
      if (adapter.name.includes('react') && (id.endsWith('.jsx') || id.endsWith('.tsx'))) return true;
      return false;
    });
    return matched.length > 0 ? matched : this.getAdapters();
  }

  static clear(): void {
    this.adapters.clear();
  }
}
