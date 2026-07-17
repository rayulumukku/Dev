import { Lexer, Parser } from '../packages/core/dist/compiler/index.js';

const code = `<div data-astro-cid="island"></div>`;
const tokens = new Lexer(code).tokenize();
const parser = new Parser(tokens);
const ast = parser.parse();

console.log(JSON.stringify(ast, null, 2));
