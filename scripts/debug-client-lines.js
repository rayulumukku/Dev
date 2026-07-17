import { RayBundler } from '../packages/core/dist/build/rayBundler.js';
import path from 'path';
import fs from 'fs';

async function test() {
  try {
    const bundler = new RayBundler(process.cwd());
    const entry = path.resolve('node_modules/scheduler/index.js');
    console.log('Entry exists:', fs.existsSync(entry));
    const out = path.resolve('scratch/scheduler_out.js');
    
    const res = await bundler.bundle({
      entryPoint: entry,
      outFile: out,
      format: 'esm',
    });
    console.log('Bundle finished, output code length:', res.code.length);

    const lines = res.code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED')) {
        console.log(`Line ${i + 1}: ${lines[i].trim()}`);
      }
    }
  } catch (err) {
    console.error('Bundle error:', err);
  }
}

test();
