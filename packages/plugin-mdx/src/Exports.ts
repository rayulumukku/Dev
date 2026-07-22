export function formatFrontmatterExports(data: Record<string, any>): string {
  const json = JSON.stringify(data, null, 2);
  return `\nexport const frontmatter = ${json};\n`;
}
