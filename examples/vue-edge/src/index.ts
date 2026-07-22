import { EdgeAdapter } from '@ray/edge-runtime';

export default {
  async fetch(req: Request) {
    return EdgeAdapter.handleStream(['<div>', '<h1>Vue Edge Streaming App</h1>', '</div>']);
  },
};
