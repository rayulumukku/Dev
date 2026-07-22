export class DependencyResolver {
  static detectCircular(graph: Record<string, string[]>): string[] | null {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    function dfs(node: string, path: string[]): string[] | null {
      visited.add(node);
      recStack.add(node);

      const neighbors = graph[node] || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          const res = dfs(neighbor, [...path, neighbor]);
          if (res) return res;
        } else if (recStack.has(neighbor)) {
          return [...path, neighbor];
        }
      }

      recStack.delete(node);
      return null;
    }

    for (const node of Object.keys(graph)) {
      if (!visited.has(node)) {
        const cycle = dfs(node, [node]);
        if (cycle) return cycle;
      }
    }
    return null;
  }
}
