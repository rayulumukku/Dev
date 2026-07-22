import { renderFullHTML } from './HTMLRenderer.js';

export class SSRRenderer {
  async renderPage(renderFn, options) {
    const result = await renderFn(options.url);
    if (options.initialData) {
      result.initialData = { ...result.initialData, ...options.initialData };
    }
    const template = options.template || '<!DOCTYPE html><html><head></head><body><!--app-html--></body></html>';
    return renderFullHTML(template, result);
  }
}
