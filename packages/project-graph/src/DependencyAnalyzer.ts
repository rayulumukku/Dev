import { ProjectNode } from './types.js';

export class DependencyAnalyzer {
  static resolveInterProjectDependencies(projects: ProjectNode[]): Map<string, string[]> {
    const projectNames = new Set(projects.map(p => p.name));
    const graph = new Map<string, string[]>();

    for (const proj of projects) {
      const interDeps = proj.dependencies.filter(dep => projectNames.has(dep));
      if (proj.implicitDependencies) {
        interDeps.push(...proj.implicitDependencies.filter(dep => projectNames.has(dep)));
      }
      graph.set(proj.name, Array.from(new Set(interDeps)));
    }

    return graph;
  }
}
