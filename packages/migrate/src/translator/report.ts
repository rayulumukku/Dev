/**
 * Generates the Markdown migration report containing framework details,
 * successfully migrated fields, skipped fields, and manual action items.
 */
export function generateMigrationReport(
  framework: string,
  supportedFields: string[],
  ignoredFields: string[]
): string {
  const lines: string[] = [];
  lines.push(`# Ray Migration Report`);
  lines.push(``);
  lines.push(`- **Detected Framework**: ${framework}`);
  lines.push(`- **Status**: Completed with ${ignoredFields.length} ignored fields`);
  lines.push(``);
  lines.push(`## Successfully Migrated`);
  lines.push(``);
  if (supportedFields.length === 0) {
    lines.push(`No configuration fields were migrated.`);
  } else {
    lines.push(`The following fields were successfully mapped to Ray equivalents:`);
    for (const field of supportedFields) {
      lines.push(`- \`${field}\``);
    }
  }
  lines.push(``);
  lines.push(`## Ignored Fields`);
  lines.push(``);
  if (ignoredFields.length === 0) {
    lines.push(`No fields were ignored.`);
  } else {
    lines.push(`The following Vite-specific fields are currently unsupported by Ray and were skipped:`);
    for (const field of ignoredFields) {
      lines.push(`- \`${field}\``);
    }
  }
  lines.push(``);
  lines.push(`## Manual Review Required`);
  lines.push(``);
  lines.push(`The following items require manual review:`);
  lines.push(`- **Plugins**: Any custom plugins configured in the Vite configuration must be manually translated or replaced by equivalent Ray plugins.`);
  if (ignoredFields.length > 0) {
    lines.push(`- **Ignored Settings**: Please ensure that the skipped settings (listed above) are not critical for your application runtime.`);
  }
  lines.push(``);
  return lines.join('\n');
}
