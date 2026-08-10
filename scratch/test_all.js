import { execSync } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';
async function run() {
  const urls = [
    'http://localhost:3012/@modules/react',
    'http://localhost:3012/@modules/react-dom/client',
    'http://localhost:3012/src/App.jsx',
    'http://localhost:3012/src/app/layout.jsx',
    'http://localhost:3012/src/app/page.jsx',
    'http://localhost:3012/src/doc.mdx?import',
    'http://localhost:3012/src/styles.module.css?import',
    'http://localhost:3012/src/math.wasm?import',
    'http://localhost:3012/src/worker.js',
    'http://localhost:3012/@ray/deps/react.js',
    'http://localhost:3012/@ray/deps/react-dom.js',
    'http://localhost:3012/@modules/scheduler',
  ];
  for (const url of urls) {
    console.log('Fetching', url);
    const res = await fetch(url);
    if (!res.ok) {
      console.log('FAILED TO FETCH:', url, res.status);
      continue;
    }
    const code = await res.text();
    fs.writeFileSync('scratch/temp.js', code);
    try {
      execSync('node -c scratch/temp.js', { stdio: 'pipe' });
      console.log('SUCCESS:', url);
    } catch (e) {
      console.error('SYNTAX ERROR IN:', url);
    }
  }
}
run().catch(console.error);
