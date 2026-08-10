import { RayCompiler } from './packages/core/dist/index.js';
import fs from 'fs';

const compiler = new RayCompiler();
try {
  const code = fs.readFileSync('doc-output.js', 'utf-8');
  const result = compiler.compile(code, { id: 'doc.mdx' });
  console.log(result.code);
} catch (e) {
  console.error(e);
}
