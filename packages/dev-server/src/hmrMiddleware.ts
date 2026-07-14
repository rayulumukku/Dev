import { RayCore } from '@ray/core';

/**
 * Handles the GET /__ray/hmr diagnostics endpoint.
 * Returns the list of self-accepting components from the graph as active HMR boundaries.
 */
export function handleHmrDiagnosticsRequest(ray: RayCore, urlPath: string, res: any): boolean {
  if (urlPath === '/__ray/hmr') {
    const boundaries: string[] = [];

    for (const mod of ray.graph.modules.values()) {
      if (mod.isSelfAccepting) {
        boundaries.push(mod.url.split('?')[0]);
      }
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      boundaries,
      acceptedModules: boundaries,
      pendingUpdates: [],
    }, null, 2));
    return true;
  }
  return false;
}
