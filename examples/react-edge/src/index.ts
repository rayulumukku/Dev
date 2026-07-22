import { EdgeAdapter, RequestContext } from '@ray/edge-runtime';

export default {
  async fetch(req: Request) {
    return EdgeAdapter.handleRequest(req, async () => {
      return `<div><h1>React Edge SSR App</h1></div>`;
    });
  },
};
