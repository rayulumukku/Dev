import { RayCompiler, Lexer, Parser } from '../packages/core/dist/compiler/index.js';
import fs from 'fs';

const compiler = new RayCompiler({});
const rawCode = fs.readFileSync('tests/fixtures/ecosystem-project/src/main.jsx', 'utf-8');
const res = compiler.compile(rawCode, 'tests/fixtures/ecosystem-project/src/main.jsx');

console.log('Successfully compiled!');

try {
  const tokens = new Lexer(res.code).tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  console.log('Successfully parsed compiled code!');
} catch (err) {
  console.error('Failed to parse compiled code:', err.message, err.stack);
}
