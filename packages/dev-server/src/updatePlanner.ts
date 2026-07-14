import path from 'path';
import { RayCore } from '@ray/core';

interface Update {
  path: string;
  acceptedPath: string;
  timestamp: number;
}

/**
 * Plans HMR updates by tracing the module dependency graph from the changed file.
 * Returns a list of updates if HMR boundaries are found, or fallback = true if a full reload is required.
 */
export function planUpdates(
  ray: RayCore,
  changedFile: string,
  timestamp: number
): { updates: Update[]; fallback: boolean } {
  const updates: Update[] = [];
  const visited = new Set<string>();
  const queue: string[] = [changedFile];

  visited.add(changedFile);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const node = ray.graph.getModule(current);

    // Check if the current module node is an accepting HMR boundary
    const isSelfAccepting = node ? node.isSelfAccepting : false;

    if (isSelfAccepting) {
      const relPath = '/' + path.relative(ray.projectRoot, current).replace(/\\/g, '/');
      const changedRelPath = '/' + path.relative(ray.projectRoot, changedFile).replace(/\\/g, '/');
      updates.push({
        path: changedRelPath,
        acceptedPath: relPath,
        timestamp,
      });
      continue;
    }

    // Walk up to importers if not self-accepting
    const importers = ray.getImporters(current);
    if (importers.size === 0) {
      // Reached entry point without finding a boundary -> fallback to full reload
      return { updates: [], fallback: true };
    }

    for (const importer of importers) {
      if (!visited.has(importer)) {
        visited.add(importer);
        queue.push(importer);
      }
    }
  }

  return { updates, fallback: false };
}
