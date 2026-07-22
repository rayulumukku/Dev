import { InspectorNode, InspectorEdge, CircularCycle } from './types.js';

export class GraphSerializer {
  private nodes = new Map<string, InspectorNode>();
  private edges: InspectorEdge[] = [];

  addNode(node: InspectorNode): void {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: InspectorEdge): void {
    this.edges.push(edge);
  }

  detectCircularDependencies(): CircularCycle[] {
    const cycles: CircularCycle[] = [];
    const adj = new Map<string, string[]>();

    for (const edge of this.edges) {
      if (!adj.has(edge.source)) adj.set(edge.source, []);
      adj.get(edge.source)!.push(edge.target);
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];

    const dfs = (curr: string) => {
      visited.add(curr);
      recStack.add(curr);
      path.push(curr);

      const neighbors = adj.get(curr) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          dfs(n);
        } else if (recStack.has(n)) {
          const startIndex = path.indexOf(n);
          if (startIndex !== -1) {
            const cycleNodes = path.slice(startIndex);
            cycleNodes.push(n);
            cycles.push({
              cycle: cycleNodes,
              suggestedBreakPoint: cycleNodes[cycleNodes.length - 2],
            });
          }
        }
      }

      path.pop();
      recStack.delete(curr);
    };

    for (const node of this.nodes.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  toJSON(): string {
    return JSON.stringify({
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      cycles: this.detectCircularDependencies(),
    }, null, 2);
  }
}
