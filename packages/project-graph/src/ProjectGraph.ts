import { ProjectNode } from './types.js';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';

export class ProjectGraph {
  private nodes = new Map<string, ProjectNode>();
  private edges = new Map<string, string[]>();

  constructor(projects: ProjectNode[] = []) {
    for (const proj of projects) {
      this.addProject(proj);
    }
  }

  addProject(proj: ProjectNode): void {
    this.nodes.set(proj.name, proj);
    this.rebuildEdges();
  }

  getProject(name: string): ProjectNode | undefined {
    return this.nodes.get(name);
  }

  getProjects(): ProjectNode[] {
    return Array.from(this.nodes.values());
  }

  getDependencies(name: string): string[] {
    return this.edges.get(name) || [];
  }

  private rebuildEdges(): void {
    this.edges = DependencyAnalyzer.resolveInterProjectDependencies(Array.from(this.nodes.values()));
  }

  toSortedOrder(): string[] {
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (name: string) => {
      if (visited.has(name)) return;
      visited.add(name);
      const deps = this.getDependencies(name);
      for (const dep of deps) {
        visit(dep);
      }
      order.push(name);
    };

    for (const name of this.nodes.keys()) {
      visit(name);
    }

    return order;
  }
}
