/**
 * Injects the Ray WebSocket HMR client script before the closing </body> tag.
 * Allows the browser to hook into the hot reload stream automatically.
 */
export function injectHmrClient(html: string): string {
  const hmrScript = '<script type="module" src="/@ray/hmr.js"></script>';

  if (html.includes('</body>')) {
    return html.replace('</body>', `${hmrScript}\n</body>`);
  }

  // Fallback if the body tag isn't well-formed
  return html + '\n' + hmrScript;
}
