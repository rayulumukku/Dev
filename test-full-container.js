import { PluginContainer } from './packages/core/dist/plugin/container.js';
import { jsxPlugin } from './packages/core/dist/plugin/builtins/jsxPlugin.js';
import { hmrPlugin } from './packages/core/dist/plugin/builtins/hmrPlugin.js';
import { reactPlugin } from './packages/core/dist/plugin/official/react.js';
import fs from 'fs';

async function run() {
  const container = new PluginContainer([
    hmrPlugin(),
    jsxPlugin(),
    reactPlugin()
  ], {}, process.cwd());

  const id = 'C:/Users/HP/Desktop/Devops-Pipelines/tests/fixtures/ecosystem-project/src/App.jsx';
  const code = fs.readFileSync(id, 'utf-8');
  
  const result = await container.transform(code, id);
  console.log(result.code);
}

run().catch(console.error);
