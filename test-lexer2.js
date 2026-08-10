import { Lexer } from './packages/core/dist/compiler/lexer.js';
import fs from 'fs';

const code = fs.readFileSync('doc-output.js', 'utf-8');
const lexer = new Lexer(code);
const tokens = lexer.tokenize();
console.log(tokens.filter(t => t.line >= 16 && t.line <= 19));
