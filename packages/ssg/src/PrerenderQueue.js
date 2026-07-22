export class PrerenderQueue {
  async processRoutes(routes, renderFn) {
    const results = [];

    for (const r of routes) {
      try {
        const html = await renderFn(r.path);
        results.push({ route: r.path, html });
      } catch (err) {
        results.push({ route: r.path, html: '', error: err });
      }
    }

    return results;
  }
}
