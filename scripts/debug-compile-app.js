import { RayCore } from '../packages/core/dist/index.js';
import fs from 'fs';
import path from 'path';

async function test() {
  const core = new RayCore('tests/fixtures/ecosystem-project', 'development');
  await core.init();
  const fileContent = fs.readFileSync('tests/fixtures/ecosystem-project/src/App.jsx', 'utf-8');
  try {
    const transformed = await core.transform(fileContent, path.resolve('tests/fixtures/ecosystem-project/src/App.jsx'));
    console.log('TRANSFORM SUCCESSFUL FOR App.jsx!');
    console.log(transformed);
  } catch (err) {
    console.error('TRANSFORM FAILED:', err.message, err.stack);
  }
}

test();
