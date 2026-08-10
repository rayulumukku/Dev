import fs from 'fs';
import { execSync } from 'child_process';
async function run() {
  const compiler = await import('file:///C:/Users/HP/Desktop/Devops-Pipelines/packages/core/src/compiler/index.js');
  const files = [
    'node_modules/react/cjs/react.development.js',
    'node_modules/react-dom/cjs/react-dom.development.js',
    'node_modules/react-dom/client.js'
  ];
  for (const f of files) {
    let code = fs.readFileSync(f, 'utf-8');
    const res = new compiler.RayCompiler({}).compile(code, f);
    fs.writeFileSync('scratch/out.js', res.code);
    try {
      execSync('node -c scratch/out.js', { stdio: 'pipe' });
      console.log('SUCCESS:', f);
    } catch (e) {
      console.error('SYNTAX ERROR:', f);
    }
  }
}
run().catch(console.error);
