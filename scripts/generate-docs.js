import fs from 'fs';
import path from 'path';

console.log('Generating API documentation from source...');

const coreSrcDir = path.resolve('packages/core/src');
const apiFilePath = path.resolve('docs/api.md');

const modulesToScan = [
  { name: 'Resolver', file: 'resolver/index.ts' },
  { name: 'DependencyGraph', file: 'graph/index.ts' },
  { name: 'ModuleNode', file: 'graph/moduleNode.ts' },
  { name: 'buildProject', file: 'build/index.ts' },
  { name: 'PluginContainer', file: 'plugin/container.ts' },
  { name: 'runOptimizer', file: 'optimizer/index.ts' },
  { name: 'RayCompiler', file: 'compiler/index.ts' },
  { name: 'RayCore', file: 'index.ts' }
];

let markdown = `# Ray API Reference

This document is automatically generated from the source code.

`;

for (const mod of modulesToScan) {
  const filePath = path.join(coreSrcDir, mod.file);
  if (fs.existsSync(filePath)) {
    const code = fs.readFileSync(filePath, 'utf-8');
    markdown += `## ${mod.name}\n\n`;
    markdown += `*Source Location: [${mod.file}](file:///${filePath.replace(/\\/g, '/')})*\n\n`;

    // Look for JSDoc and class/function declarations
    const jsdocs = [];
    const regex = /\/\*\*([\s\S]*?)\*\/[\s\r\n]*(export\s+(class|function|const|interface|async\s+function)\s+(\w+))/g;
    let match;
    while ((match = regex.exec(code)) !== null) {
      const docComment = match[1].split('\n')
        .map(line => line.trim().replace(/^\*\s?/, ''))
        .filter(line => line.length > 0)
        .join(' ');
      const symbolType = match[3];
      const symbolName = match[4];

      if (symbolName === mod.name || code.includes(`export class ${mod.name}`) || code.includes(`export async function ${mod.name}`)) {
        jsdocs.push({ name: symbolName, type: symbolType, doc: docComment });
      }
    }

    if (jsdocs.length > 0) {
      for (const item of jsdocs) {
        markdown += `### \`${item.name}\` (${item.type})\n\n`;
        markdown += `${item.doc}\n\n`;
      }
    } else {
      // General fallbacks
      markdown += `Class or function entrypoint representing \`${mod.name}\` module operations inside Ray.\n\n`;
    }
  }
}

fs.writeFileSync(apiFilePath, markdown, 'utf-8');
console.log(`API documentation generated at: ${apiFilePath}`);
