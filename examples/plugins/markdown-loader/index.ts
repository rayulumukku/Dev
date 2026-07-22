import { definePlugin } from '@ray/plugin-sdk';

export const markdownLoaderPlugin = definePlugin(() => ({
  name: 'ray-plugin-markdown-loader',
  description: 'Translates .md markdown files into HTML module strings.',
  async transform(code, id) {
    if (!id.endsWith('.md')) return null;
    const html = `<div class="markdown">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;
    return { code: `export default ${JSON.stringify(html)};` };
  },
}));
