import { RayCore } from '@ray/core';
import path from 'path';

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

/**
 * Parses index.html, extracts CSS stylesheet link tags, and registers them
 * in the dependency graph as direct dependencies of the HTML page.
 */
export function parseAndRegisterHtmlAssets(html: string, htmlFilePath: string, ray: RayCore) {
  // Matches <link rel="stylesheet" href="...">
  const linkRegex = /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match;
  const depIds = new Set<string>();

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];

    // Ignore external URLs (e.g. CDNs) and non-CSS links
    if (!/^(https?:|\/\/)/i.test(href) && href.endsWith('.css')) {
      try {
        const resolvedPath = ray.resolve(href, htmlFilePath);
        depIds.add(resolvedPath);

        // Normalize browser URL path (relative or root absolute)
        const relativeUrl = href.startsWith('/') ? href : '/' + href;
        ray.registerModule(resolvedPath, resolvedPath, relativeUrl);
      } catch (err) {
        console.error(`[Ray HTML Parser] Failed to resolve link href "${href}":`, err);
      }
    }
  }

  // Register HTML itself and link its CSS dependencies
  const relativeHtmlUrl = '/index.html';
  ray.registerModule(htmlFilePath, htmlFilePath, relativeHtmlUrl);
  ray.updateDependencies(htmlFilePath, depIds);
}
