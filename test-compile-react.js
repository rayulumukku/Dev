import { RayCompiler } from './packages/core/dist/index.js';
import { reactPlugin } from './packages/core/dist/plugin/official/react.js';
import fs from 'fs';

const compiler = new RayCompiler();
const plugin = reactPlugin();
plugin.projectRoot = process.cwd();
plugin.graph = { registerModule: () => ({}) };

try {
  const code = fs.readFileSync('tests/fixtures/ecosystem-project/src/App.jsx', 'utf-8');
  const result = compiler.compile(code, { id: 'tests/fixtures/ecosystem-project/src/App.jsx' });
  plugin.transform.call(plugin, result.code, 'tests/fixtures/ecosystem-project/src/App.jsx').then(res => {
    console.log(res.code);
  });
} catch (e) {
  console.error(e);
}
