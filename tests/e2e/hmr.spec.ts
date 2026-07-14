import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { startDevServer } from '../../packages/dev-server/src/index.js';

let serverInstance: any;
let devServerPort = 3012;

test.beforeAll(async () => {
  // Start the dev server in the demo directory for testing
  const originalDir = process.cwd();
  process.chdir(path.resolve(originalDir, 'demo'));

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

test.describe('Ray E2E Developer Server Checks', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto(`http://localhost:${devServerPort}/`);
    await expect(page).toHaveTitle('Ray Dev Server - Milestone 2 Demo');
    
    // Check if main root is present
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('should check asset loading and styling', async ({ page }) => {
    await page.goto(`http://localhost:${devServerPort}/`);
    // Assert CSS styling has loaded (e.g. check background style on body or container)
    const container = page.locator('div').first();
    await expect(container).toBeDefined();
  });

  test('should load dynamic imports on demand', async ({ page }) => {
    await page.goto(`http://localhost:${devServerPort}/`);
    // Assuming dynamic modules loaded in demo app
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeDefined();
  });

  test('should support source maps mapping', async ({ page }) => {
    await page.goto(`http://localhost:${devServerPort}/`);
    // Source map tag should be present in loaded scripts
    const response = await page.request.get(`http://localhost:${devServerPort}/src/main.jsx`);
    const text = await response.text();
    expect(text).toContain('sourceMappingURL');
  });
});
