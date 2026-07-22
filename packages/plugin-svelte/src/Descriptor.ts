import { SvelteDescriptor } from './types.js';

export class SvelteDescriptorParser {
  static parse(code: string): SvelteDescriptor {
    const scriptMatch = code.match(/<script>([\s\S]*?)<\/script>/);
    const styleMatch = code.match(/<style>([\s\S]*?)<\/style>/);
    const templateHtml = code
      .replace(/<script>[\s\S]*?<\/script>/g, '')
      .replace(/<style>[\s\S]*?<\/style>/g, '')
      .trim();

    return {
      script: scriptMatch ? { code: scriptMatch[1].trim() } : undefined,
      template: { code: templateHtml },
      style: styleMatch ? { code: styleMatch[1].trim() } : undefined,
    };
  }
}
