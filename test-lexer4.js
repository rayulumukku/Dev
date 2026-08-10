import { Lexer } from './packages/core/dist/compiler/lexer.js';
const lexer = new Lexer('</MDXLayout>');
console.log(lexer.tokenize());
