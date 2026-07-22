export function formatFrontmatterExports(data: Record<string, any>): string {
  const json = JSON.stringify(data, null, 2);
  let exportsCode = `\nexport const frontmatter = ${json};\n`;

  // Also export valid top-level keys as individual named exports
  const validIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/;
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'frontmatter' && key !== 'default' && validIdentifier.test(key)) {
      exportsCode += `export const ${key} = ${JSON.stringify(value)};\n`;
    }
  }

  return exportsCode;
}
