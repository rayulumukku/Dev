import { RayPluginDefinition } from './Plugin.js';

export function generatePluginDocs(plugin: RayPluginDefinition): string {
  const name = plugin.name || 'Unnamed Plugin';
  const desc = plugin.description || 'Ray bundler extension plugin.';
  const version = plugin.version || '1.0.0';
  const author = plugin.author || 'Anonymous';

  let docs = `# ${name} (\`v${version}\`)\n\n`;
  docs += `${desc}\n\n`;
  docs += `**Author**: ${author}\n\n`;

  if (plugin.compatibility) {
    docs += `## Compatibility\n\n`;
    if (plugin.compatibility.minRayVersion) docs += `- **Min Ray Version**: \`>= ${plugin.compatibility.minRayVersion}\`\n`;
    if (plugin.compatibility.maxRayVersion) docs += `- **Max Ray Version**: \`<= ${plugin.compatibility.maxRayVersion}\`\n`;
    docs += `\n`;
  }

  if (plugin.schema && plugin.schema.fields) {
    docs += `## Configuration Options\n\n`;
    docs += `| Option | Type | Required | Default | Description |\n`;
    docs += `| --- | --- | --- | --- | --- |\n`;

    for (const [key, field] of Object.entries<any>(plugin.schema.fields)) {
      docs += `| \`${key}\` | \`${field.type}\` | ${field.required ? 'Yes' : 'No'} | \`${field.default !== undefined ? JSON.stringify(field.default) : '-'}\` | ${field.description || '-'} |\n`;
    }
    docs += `\n`;
  }

  docs += `## Usage\n\n\`\`\`typescript\nimport { ${name.replace(/[^a-zA-Z0-9]/g, '')} } from '${name}';\n\nexport default {\n  plugins: [\n    ${name.replace(/[^a-zA-Z0-9]/g, '')}()\n  ]\n};\n\`\`\`\n`;

  return docs;
}
