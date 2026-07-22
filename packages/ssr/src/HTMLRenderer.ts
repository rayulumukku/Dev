import { SSRRenderResult } from './types.js';
import { generateHydrationScript } from './Hydration.js';

export function renderFullHTML(template: string, result: SSRRenderResult): string {
  const headElements = (result.head || []).join('\n');
  const hydrationScript = generateHydrationScript(result.initialData);

  let html = template;

  if (headElements || hydrationScript) {
    const headTagEnd = html.indexOf('</head>');
    if (headTagEnd !== -1) {
      html = html.slice(0, headTagEnd) + headElements + '\n' + hydrationScript + '\n' + html.slice(headTagEnd);
    }
  }

  const appOutlet = '<!--app-html-->';
  if (html.includes(appOutlet)) {
    html = html.replace(appOutlet, result.html);
  } else {
    const bodyTagEnd = html.indexOf('</body>');
    if (bodyTagEnd !== -1) {
      html = html.slice(0, bodyTagEnd) + `<div id="app">${result.html}</div>` + html.slice(bodyTagEnd);
    } else {
      html += `<div id="app">${result.html}</div>`;
    }
  }

  return html;
}
