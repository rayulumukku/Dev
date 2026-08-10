const { RayCompiler } = require('./packages/core/dist/compiler/index.js');
const compiler = new RayCompiler();
const code = 'export default function App() { return React.createElement("div"); }';
const out = compiler.compile(code, { filename: 'App.jsx' });
console.log(out.code);
