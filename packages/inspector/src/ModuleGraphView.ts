export class ModuleGraphView {
  static formatGraph(nodes: any[], edges: any[]): Record<string, any> {
    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodes,
      edges,
    };
  }
}
