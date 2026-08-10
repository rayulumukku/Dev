import fs from 'fs';
import { RayCompiler } from '../packages/core/dist/compiler/index.js';
const compiler = new RayCompiler();
const code = fs.readFileSync('tests/fixtures/ecosystem-project/src/main.jsx', 'utf-8');
const out = compiler.compile(code, { filename: 'main.jsx' });
console.log(out.code);
