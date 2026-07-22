export class SassDependencyTracker {
  constructor() {
    this.deps = new Map();
  }

  addDependency(file, importedFile) {
    if (!this.deps.has(file)) {
      this.deps.set(file, new Set());
    }
    this.deps.get(file).add(importedFile);
  }

  getDependencies(file) {
    const set = this.deps.get(file);
    return set ? Array.from(set) : [];
  }

  clear() {
    this.deps.clear();
  }
}

export const globalSassDependencyTracker = new SassDependencyTracker();
