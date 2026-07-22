import { WorkspacePackageInfo, WorkspaceGraphNode } from './types.js';

export class WorkspaceGraph {
  private nodes = new Map<string, WorkspaceGraphNode>();

  constructor(packages: Map<string, WorkspacePackageInfo>) {
    for (const [name, pkg] of packages.entries()) {
      this.nodes.set(name, {
        packageInfo: pkg,
        dependencies: [],
        dependents: [],
      });
    }

    for (const [name, pkg] of packages.entries()) {
      const node = this.nodes.get(name)!;
      for (const dep of pkg.dependencies) {
        if (packages.has(dep)) {
          node.dependencies.push(dep);
          this.nodes.get(dep)?.dependents.push(name);
        }
      }
    }
  }

  getNode(packageName: string): WorkspaceGraphNode | undefined {
    return this.nodes.get(packageName);
  }

  getDependents(packageName: string): string[] {
    return this.nodes.get(packageName)?.dependents || [];
  }

  getAllNodes(): WorkspaceGraphNode[] {
    return Array.from(this.nodes.values());
  }
}
