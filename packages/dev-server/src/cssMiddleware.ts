import { RayCore } from '@ray/core';

/**
 * Compiles raw CSS text into a browser-executable JavaScript module.
 * The module dynamically injects the stylesheet into a <style> tag.
 * Stores a reference using the served URL path as an element ID.
 */
export function compileCssToJs(cssContent: string, servedPath: string): string {
  // Escape backticks, backslashes, and dollar signs for double template string usage
  const escapedCss = cssContent
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$');

  return `
const css = \`${escapedCss}\`;
const id = ${JSON.stringify(servedPath)};
let style = document.getElementById(id);
if (!style) {
  style = document.createElement('style');
  style.id = id;
  document.head.appendChild(style);
}
style.textContent = css;
export default css;
`;
}

/**
 * Handles the GET /__ray/css diagnostics route.
 * Scans the active dependency graph modules and returns a list of tracked CSS stylesheets.
 */
export function handleCssDiagnosticsRequest(ray: RayCore, urlPath: string, res: any): boolean {
  if (urlPath === '/__ray/css') {
    const tracked = Array.from(ray.graph.modules.values())
      .filter((m) => m.file.endsWith('.css'))
      .map((m) => m.url.split('?')[0]);

    // De-duplicate in case both link and import styles are tracked
    const uniqueTracked = Array.from(new Set(tracked));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ tracked: uniqueTracked }, null, 2));
    return true;
  }
  return false;
}
