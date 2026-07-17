import { RayCore } from '../packages/core/dist/index.js';
import path from 'path';

async function test() {
  const originalDir = process.cwd();
  process.chdir(path.resolve(originalDir, 'tests/fixtures/ecosystem-project'));

  const ray = new RayCore({
    root: process.cwd(),
    mode: 'development',
    server: { port: 3030 }
  });

  await ray.init();
  console.log('Running optimizer...');
  await ray.optimize({ force: true });
  console.log('Optimizer complete.');

  process.chdir(originalDir);
}

test();
