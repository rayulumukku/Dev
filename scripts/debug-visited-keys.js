import { RayBundler } from '../packages/core/dist/build/rayBundler.js';
import path from 'path';

async function test() {
  const bundler = new RayBundler(process.cwd());
  const entry = path.resolve('node_modules/react/index.js');
  const out = path.resolve('scratch/out2.js');

  const originalBundle = bundler.bundle;
  bundler.bundle = async function(options) {
    const res = await originalBundle.call(this, options);
    console.log('Visited keys:', Array.from(this.visitedModules.keys()));
    return res;
  };
  
  await bundler.bundle({
    entryPoint: entry,
    outFile: out,
    format: 'esm',
  });
}

test();
