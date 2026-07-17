import { RayCompiler } from '../packages/core/dist/compiler/index.js';
import fs from 'fs';

const compiler = new RayCompiler({});
const rawCode = fs.readFileSync('tests/fixtures/ecosystem-project/src/main.jsx', 'utf-8');
const res = compiler.compile(rawCode, 'tests/fixtures/ecosystem-project/src/main.jsx');

console.log('--- COMPILED JS CODE ---');
console.log(res.code);
