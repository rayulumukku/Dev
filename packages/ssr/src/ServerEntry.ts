import { SSRRenderResult } from './types.js';

export async function executeServerRender(renderFn: (url: string) => Promise<SSRRenderResult> | SSRRenderResult, url: string): Promise<SSRRenderResult> {
  return await renderFn(url);
}
