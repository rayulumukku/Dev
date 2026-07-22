import { SvelteDescriptor } from './types.js';

export class SvelteSSRRenderer {
  static compileSSR(descriptor: SvelteDescriptor, id: string): string {
    const script = descriptor.script ? descriptor.script.code : '';
    const template = descriptor.template.code;

    return `
${script}
export default {
  render(props = {}) {
    const html = \`<div class="svelte-ssr">${template}</div>\`;
    const css = { code: '${descriptor.style ? descriptor.style.code.replace(/'/g, "\\'") : ''}' };
    return { html, css, head: '' };
  }
};
`;
  }
}
