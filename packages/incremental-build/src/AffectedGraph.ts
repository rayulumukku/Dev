export class AffectedGraph {
  computeAffected(changedFiles: Set<string>, graph: any): Set<string> {
    const affected = new Set<string>(changedFiles);
    const queue = Array.from(changedFiles);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (graph && typeof graph.getImporters === 'function') {
        const importers: Set<string> = graph.getImporters(current);
        for (const imp of importers) {
          if (!affected.has(imp)) {
            affected.add(imp);
            queue.push(imp);
          }
        }
      }
    }

    return affected;
  }
}
