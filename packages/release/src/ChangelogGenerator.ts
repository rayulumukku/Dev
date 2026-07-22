import { PackageReleaseInfo } from './types.js';

export class ChangelogGenerator {
  static generateMarkdown(releases: PackageReleaseInfo[]): string {
    const lines = [`# Release Changelog (${new Date().toISOString().split('T')[0]})\n`];

    for (const rel of releases) {
      lines.push(`## ${rel.name} v${rel.nextVersion}`);
      lines.push(`**Type**: \`${rel.bumpType}\`\n`);
      lines.push(`### Changes:`);
      for (const change of rel.changes) {
        lines.push(`- ${change}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
