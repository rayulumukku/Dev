import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { startDevServer } from '../../packages/dev-server/src/index.js';

let serverInstance: any;
let devServerPort = 3020;

test.beforeAll(async () => {
  const originalDir = process.cwd();
  
  // Clear any stale dev server cache
  const cacheDir = path.resolve(originalDir, 'tests/fixtures/ecosystem-project/.ray');
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }

  // Change working directory to ecosystem-project fixture
  process.chdir(path.resolve(originalDir, 'tests/fixtures/ecosystem-project'));

  serverInstance = await startDevServer({
    port: devServerPort,
    ssr: false,
    mode: 'development'
  });

  process.chdir(originalDir);
});

test.afterAll(async () => {
  if (serverInstance) {
    await new Promise<void>((resolve) => {
      serverInstance.server.close(() => {
        resolve();
      });
    });
    if (serverInstance.watcher) {
      await serverInstance.watcher.close();
    }
  }
});

test.describe('Ecosystem Integration & Continuous Verification Suite', () => {
  test('should verify all major frontend ecosystems render and function', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message, '\nStack:\n', err.stack));
    page.on('request', req => console.log('REQUEST:', req.url()));
    page.on('response', res => {
      console.log('RESPONSE:', res.url(), res.status(), res.headers()['content-type']);
    });

    const resp = await page.request.get(`http://localhost:${devServerPort}/src/main.jsx`);
    console.log('main.jsx STATUS:', resp.status());
    console.log('main.jsx HEADERS:', resp.headers());
    console.log('main.jsx BODY:', await resp.text());

    await page.goto(`http://localhost:${devServerPort}/`);

    // 1. React & Next.js layout checks
    const layout = page.locator('.next-layout');
    await expect(layout).toBeVisible();
    await expect(page.locator('.next-page')).toHaveText('Next.js-style Page Component Hydrated successfully.');

    // 2. Remix loader checks
    const remixMsg = page.locator('.remix-loader-msg');
    await expect(remixMsg).toHaveText('Hello from Remix Loader!');

    // 3. Astro island integration check
    const astroIsland = page.locator('.astro-island');
    await expect(astroIsland).toBeVisible();
    await expect(astroIsland.locator('button')).toHaveText('Astro Interactive Client Button');

    // 4. MDX rendering check
    const mdxSection = page.locator('.mdx-section');
    await expect(mdxSection.locator('h1')).toHaveText('MDX Heading Verification');
    await expect(mdxSection.locator('.mdx-meta')).toHaveText('Frontmatter Title: MDX Verification | Author: Ray Test Suite');

    // 5. CSS Modules checks
    const cssModuleCard = page.locator('.css-module-card');
    await expect(cssModuleCard).toBeVisible();
    // Hashed class should be generated
    const classAttribute = await cssModuleCard.getAttribute('class');
    expect(classAttribute).toContain('card_');

    // 6. Web Workers async background checking
    const workerVal = page.locator('#worker-val');
    await expect(workerVal).toHaveText('42', { timeout: 10000 });

    // 7. WASM loading and dynamic calculation checking
    const wasmVal = page.locator('#wasm-val');
    await expect(wasmVal).toHaveText('42', { timeout: 10000 });
  });
});
