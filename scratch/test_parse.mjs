import { RayCompiler } from '../packages/core/dist/compiler/index.js';
import { Parser } from '../packages/core/dist/compiler/parser.js';
const parser = new Parser('import.meta.hot');
console.log(JSON.stringify(parser.parse(), null, 2));
