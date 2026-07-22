export class SolidSSRRenderer {
  static compileSSR(code: string, id: string): string {
    return `
import { renderToString } from 'solid-js/web';
${code}

export function render(props = {}) {
  const html = renderToString(() => typeof Component !== 'undefined' ? Component(props) : null);
  return { html, css: '' };
}
`;
  }
}
