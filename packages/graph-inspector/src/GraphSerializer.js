export class GraphSerializer {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }

  addNode(node) {
    this.nodes.set(node.id, node);
  }

  addEdge(edge) {
    this.edges.push(edge);
  }

  detectCircularDependencies() {
    const cycles = [];
    const adj = new Map();

    for (const edge of this.edges) {
      if (!adj.has(edge.source)) adj.set(edge.source, []);
      adj.get(edge.source).push(edge.target);
    }

    const visited = new Set();
    const recStack = new Set();
    const path = [];

    const dfs = (curr) => {
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

  toJSON() {
    return JSON.stringify({
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      cycles: this.detectCircularDependencies(),
    }, null, 2);
  }
}
