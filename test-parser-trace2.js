import { Parser } from './packages/core/dist/compiler/parser.js';
import { Lexer } from './packages/core/dist/compiler/lexer.js';
import fs from 'fs';

const code = fs.readFileSync('doc-output.js', 'utf-8');
const lexer = new Lexer(code);
const tokens = lexer.tokenize();

const parser = new Parser(tokens, code);
const originalAdvance = parser.advance.bind(parser);
parser.advance = function() {
  const t = originalAdvance();
  if (t.line >= 13) {
    console.log('ADVANCE:', t.type, t.value, t.line);
  }
  return t;
};
try {
  parser.parse();
} catch(e) {
  console.log(e);
}
