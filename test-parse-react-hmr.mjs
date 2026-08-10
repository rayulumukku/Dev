import { Lexer, Parser, CodeGenerator } from './packages/core/dist/compiler/index.js';

const code = `
export default function App() {
  return null;
}

/* Ray React HMR Component Proxies */
if (typeof App !== 'undefined') {
  App = window.__ray_register_component(new URL(import.meta.url).pathname, 'App', App);
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
`;

try {
  const lexer = new Lexer(code);
  const parser = new Parser(lexer.tokenize());
  const ast = parser.parse();
  const codegen = new CodeGenerator();
  console.log(codegen.generate(ast));
} catch (e) {
  console.error("PARSE/CODEGEN ERROR:");
  console.error(e);
}
