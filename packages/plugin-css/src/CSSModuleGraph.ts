export class CSSModuleGraph {
  private dependencies = new Map<string, Set<string>>();

  addDependency(parent: string, child: string): void {
    if (!this.dependencies.has(parent)) {
      this.dependencies.set(parent, new Set());
    }
    this.dependencies.get(parent)!.add(child);
  }

  getDependencies(filename: string): string[] {
    const deps = this.dependencies.get(filename);
    return deps ? Array.from(deps) : [];
  }

  clear(): void {
    this.dependencies.clear();
  }
}

export const globalCSSModuleGraph = new CSSModuleGraph();
