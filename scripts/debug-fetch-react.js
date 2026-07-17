import { startDevServer } from '../packages/dev-server/dist/index.js';
import path from 'path';

async function test() {
  const originalDir = process.cwd();
  process.chdir(path.resolve(originalDir, 'tests/fixtures/ecosystem-project'));

  const serverInstance = await startDevServer({
    port: 3024,
    ssr: false,
    mode: 'development'
  });

  process.chdir(originalDir);

  async function fetchUrl(url) {
    console.log(`\nFetching ${url}...`);
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log('Body length:', text.length);
      // Search for .default declarations or export let/const .default
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('.default') || lines[i].includes('default') && lines[i].includes('export')) {
          console.log(`Line ${i + 1}: ${lines[i].trim()}`);
        }
      }
    } catch (err) {
      console.error('Fetch failed:', err.message);
    }
  }

  await fetchUrl('http://localhost:3024/@modules/react/index.js');

  serverInstance.server.close();
  if (serverInstance.watcher) {
    await serverInstance.watcher.close();
  }
}

test();
