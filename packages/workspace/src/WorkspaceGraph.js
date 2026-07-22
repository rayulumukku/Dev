export class WorkspaceGraph {
  constructor(packages) {
    this.nodes = new Map();

    for (const [name, pkg] of packages.entries()) {
      this.nodes.set(name, {
        packageInfo: pkg,
        dependencies: [],
        dependents: [],
      });
    }

    for (const [name, pkg] of packages.entries()) {
      const node = this.nodes.get(name);
      for (const dep of pkg.dependencies) {
        if (packages.has(dep)) {
          node.dependencies.push(dep);
          this.nodes.get(dep)?.dependents.push(name);
        }
      }
    }
  }

  getNode(packageName) {
    return this.nodes.get(packageName);
  }

  getDependents(packageName) {
    return this.nodes.get(packageName)?.dependents || [];
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }
}
