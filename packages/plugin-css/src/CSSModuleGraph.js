export class CSSModuleGraph {
  constructor() {
    this.dependencies = new Map();
  }

  addDependency(parent, child) {
    if (!this.dependencies.has(parent)) {
      this.dependencies.set(parent, new Set());
    }
    this.dependencies.get(parent).add(child);
  }

  getDependencies(filename) {
    const deps = this.dependencies.get(filename);
    return deps ? Array.from(deps) : [];
  }

  clear() {
    this.dependencies.clear();
  }
}

export const globalCSSModuleGraph = new CSSModuleGraph();
