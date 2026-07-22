import { ProjectGraph } from './ProjectGraph.js';

export class TaskManifest {
  static generateManifest(graph: ProjectGraph): Record<string, any> {
    const manifest: Record<string, any> = {};
    for (const proj of graph.getProjects()) {
      manifest[proj.name] = {
        name: proj.name,
        type: proj.type,
        root: proj.root,
        dependencies: graph.getDependencies(proj.name),
      };
    }
    return manifest;
  }
}
