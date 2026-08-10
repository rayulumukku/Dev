import { Parser } from './packages/core/dist/compiler/parser.js';
import { Lexer } from './packages/core/dist/compiler/lexer.js';
import fs from 'fs';

try {
  const code = fs.readFileSync('doc-output.js', 'utf-8');
  const lexer = new Lexer(code);
  const parser = new Parser(lexer.tokenize(), code);
  const ast = parser.parse();
  console.log('Success!');
} catch (e) {
  console.error(e);
}
