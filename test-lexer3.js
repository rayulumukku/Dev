import { Lexer } from './packages/core/dist/compiler/lexer.js';
const lexer = new Lexer('<></>;');
console.log(lexer.tokenize());
