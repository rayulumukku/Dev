import fs from 'fs';
import { RayCompiler } from '../packages/core/dist/compiler/index.js';
const compiler = new RayCompiler();
const rawCode = fs.readFileSync('tests/fixtures/ecosystem-project/src/App.jsx', 'utf-8');
const hmrCode = `
if (!import.meta.hot) {
  import.meta.hot = (typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : globalThis).__ray_create_hot_context?.(import.meta.url);
}
` + rawCode;
const out = compiler.compile(hmrCode, { filename: 'App.jsx' });
console.log("=== OUTPUT ===");
console.log(out.code);
