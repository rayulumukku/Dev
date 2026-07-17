import { RayBundler } from '../packages/core/dist/build/rayBundler.js';
import path from 'path';

async function test() {
  const bundler = new RayBundler(process.cwd());
  const entry = path.resolve('node_modules/react/index.js');
  const out = path.resolve('scratch/out.js');
  
  await bundler.bundle({
    entryPoint: entry,
    outFile: out,
    format: 'esm',
  });
  
  console.log('Module Order:', bundler.moduleOrder);
}

test();
