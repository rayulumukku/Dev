import fs from 'fs';
import path from 'path';

export function runCreatePlugin(targetDir: string, pluginName: string, templateType: 'basic' | 'transform' | 'resolver' | 'asset' | 'analyzer' = 'basic') {
  const dir = path.resolve(targetDir, pluginName);
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });

  const pkgJson = {
    name: pluginName,
    version: '1.0.0',
    type: 'module',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    scripts: {
      build: 'tsc',
      test: 'vitest run',
    },
    dependencies: {
      '@ray/plugin-sdk': '^1.0.0',
    },
  };

  let srcCode = '';
  if (templateType === 'transform') {
    srcCode = `import { definePlugin } from '@ray/plugin-sdk';\n\nexport const ${pluginName.replace(/[^a-zA-Z0-9]/g, '')} = definePlugin(() => ({\n  name: '${pluginName}',\n  async transform(code, id) {\n    if (!id.endsWith('.txt')) return null;\n    return { code: \`export default \${JSON.stringify(code)};\` };\n  }\n}));\n`;
  } else if (templateType === 'resolver') {
    srcCode = `import { definePlugin } from '@ray/plugin-sdk';\n\nexport const ${pluginName.replace(/[^a-zA-Z0-9]/g, '')} = definePlugin(() => ({\n  name: '${pluginName}',\n  async resolveId(id) {\n    if (id === 'virtual:my-module') return '\\0virtual:my-module';\n    return null;\n  }\n}));\n`;
  } else if (templateType === 'asset') {
    srcCode = `import { definePlugin } from '@ray/plugin-sdk';\n\nexport const ${pluginName.replace(/[^a-zA-Z0-9]/g, '')} = definePlugin(() => ({\n  name: '${pluginName}',\n  async generateBundle(bundle) {\n    this.emitFile('asset-manifest.json', JSON.stringify({ timestamp: Date.now() }));\n  }\n}));\n`;
  } else if (templateType === 'analyzer') {
    srcCode = `import { definePlugin } from '@ray/plugin-sdk';\n\nexport const ${pluginName.replace(/[^a-zA-Z0-9]/g, '')} = definePlugin(() => ({\n  name: '${pluginName}',\n  async closeBundle() {\n    this.logger.info('Analysis finished cleanly.');\n  }\n}));\n`;
  } else {
    srcCode = `import { definePlugin } from '@ray/plugin-sdk';\n\nexport const ${pluginName.replace(/[^a-zA-Z0-9]/g, '')} = definePlugin(() => ({\n  name: '${pluginName}',\n  async buildStart() {\n    this.logger.info('${pluginName} initialized!');\n  }\n}));\n`;
  }

  const testCode = `import { describe, it, expect } from 'vitest';\nimport { ${pluginName.replace(/[^a-zA-Z0-9]/g, '')} } from './index.js';\n\ndescribe('${pluginName}', () => {\n  it('should instantiate successfully', () => {\n    const plugin = ${pluginName.replace(/[^a-zA-Z0-9]/g, '')}();\n    expect(plugin.name).toBe('${pluginName}');\n  });\n});\n`;

  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkgJson, null, 2));
  fs.writeFileSync(path.join(dir, 'src/index.ts'), srcCode);
  fs.writeFileSync(path.join(dir, 'src/index.test.ts'), testCode);

  return { dir, name: pluginName };
}

// CLI execution check
const args = process.argv.slice(2);
if (args.length > 0) {
  const pluginName = args[0] || 'my-ray-plugin';
  const templateIdx = args.indexOf('--template');
  const template = (templateIdx !== -1 && args[templateIdx + 1] ? args[templateIdx + 1] : 'basic') as any;

  runCreatePlugin(process.cwd(), pluginName, template);
  console.log(`🎉 Ray plugin "${pluginName}" scaffolded successfully!`);
}
