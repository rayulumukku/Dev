export class SassDependencyTracker {
  private deps = new Map<string, Set<string>>();

  addDependency(file: string, importedFile: string): void {
    if (!this.deps.has(file)) {
      this.deps.set(file, new Set());
    }
    this.deps.get(file)!.add(importedFile);
  }

  getDependencies(file: string): string[] {
    const set = this.deps.get(file);
    return set ? Array.from(set) : [];
  }

  clear(): void {
    this.deps.clear();
  }
}

export const globalSassDependencyTracker = new SassDependencyTracker();
