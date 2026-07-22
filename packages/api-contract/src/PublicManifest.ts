import { APIManifest } from './types.js';

export class PublicManifest {
  static formatMarkdownDocs(manifest: APIManifest): string {
    const lines = [`# Public API Reference: ${manifest.packageName}\n`];
    for (const sym of manifest.symbols) {
      lines.push(`## \`${sym.name}\` [${sym.stability.toUpperCase()}]`);
      lines.push(`- **Kind**: ${sym.kind}`);
      if (sym.signature) lines.push(`- **Signature**: \`${sym.signature}\``);
      if (sym.replacement) lines.push(`- **Replacement**: Use \`${sym.replacement}\``);
      lines.push('');
    }
    return lines.join('\n');
  }
}
