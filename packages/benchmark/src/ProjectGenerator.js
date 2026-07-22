import fs from 'fs';
import path from 'path';

export function generateSyntheticProject(targetDir, scale = 'small') {
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'src'), { recursive: true });

  const fileCount = scale === 'large' ? 100 : scale === 'medium' ? 30 : 5;

  let imports = '';
  for (let i = 0; i < fileCount; i++) {
    const componentCode = `export function Component${i}() { return 'Component ${i}'; }\n`;
    fs.writeFileSync(path.join(targetDir, 'src', `Component${i}.js`), componentCode);
    imports += `import { Component${i} } from './Component${i}.js';\n`;
  }

  const indexCode = `${imports}\nconsole.log('Synthetic benchmark app loaded');\n`;
  fs.writeFileSync(path.join(targetDir, 'src', 'index.js'), indexCode);

  const pkgJson = {
    name: 'synthetic-benchmark-project',
    version: '1.0.0',
    type: 'module',
    scripts: {
      build: 'ray build'
    }
  };
  fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
}
