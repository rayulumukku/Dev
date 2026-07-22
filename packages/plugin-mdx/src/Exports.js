export function formatFrontmatterExports(data) {
  const json = JSON.stringify(data, null, 2);
  return `\nexport const frontmatter = ${json};\n`;
}
