import { ProjectGraph } from './ProjectGraph.js';

export class AffectedProjects {
  static getAffectedProjects(graph: ProjectGraph, changedFiles: string[]): string[] {
    const affected = new Set<string>();
    const projects = graph.getProjects();

    for (const file of changedFiles) {
      for (const proj of projects) {
        if (file.startsWith(proj.root) || file.includes(proj.name)) {
          affected.add(proj.name);
        }
      }
    }

    // Add downstream dependent projects
    let added = true;
    while (added) {
      added = false;
      for (const proj of projects) {
        if (!affected.has(proj.name)) {
          const deps = graph.getDependencies(proj.name);
          if (deps.some(d => affected.has(d))) {
            affected.add(proj.name);
            added = true;
          }
        }
      }
    }

    return Array.from(affected);
  }
}
