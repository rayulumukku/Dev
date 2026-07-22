import { SSGRoute, SSGPrerenderResult } from './types.js';

export class PrerenderQueue {
  async processRoutes(
    routes: SSGRoute[],
    renderFn: (routePath: string) => Promise<string>
  ): Promise<SSGPrerenderResult[]> {
    const results: SSGPrerenderResult[] = [];

    for (const r of routes) {
      try {
        const html = await renderFn(r.path);
        results.push({ route: r.path, html });
      } catch (err: any) {
        results.push({ route: r.path, html: '', error: err });
      }
    }

    return results;
  }
}
