import { RayCompiler } from './packages/core/dist/index.js';
import fs from 'fs';

const compiler = new RayCompiler();
const files = [
  'tests/fixtures/ecosystem-project/src/main.jsx',
  'tests/fixtures/ecosystem-project/src/App.jsx',
  'tests/fixtures/ecosystem-project/src/app/layout.jsx',
  'tests/fixtures/ecosystem-project/src/app/page.jsx',
];

for (const file of files) {
  try {
    const code = fs.readFileSync(file, 'utf-8');
    const result = compiler.compile(code, { id: file });
    console.log(`\n=== ${file} ===\n`);
    console.log(result.code);
  } catch (e) {
    console.error(`Error compiling ${file}:`, e);
  }
}
