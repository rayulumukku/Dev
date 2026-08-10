import fs from 'fs';
import { RayCompiler } from '../packages/core/dist/compiler/index.js';
const compiler = new RayCompiler();
const code = fs.readFileSync('tests/fixtures/ecosystem-project/src/App.jsx', 'utf-8');
const out = compiler.compile(code, { filename: 'App.jsx' });
console.log(out.code);
