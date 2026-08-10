import { RayCompiler } from './packages/core/dist/index.js';
import fs from 'fs';

const compiler = new RayCompiler();
try {
  const code = fs.readFileSync('tests/fixtures/ecosystem-project/src/App.jsx', 'utf-8');
  const result = compiler.compile(code, { id: 'tests/fixtures/ecosystem-project/src/App.jsx' });
  console.log(result.code);
} catch (e) {
  console.error(e);
}
