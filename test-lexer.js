import { Lexer } from './packages/core/dist/compiler/lexer.js';
const lexer = new Lexer('{ "title": "val" }');
console.log(lexer.tokenize());
