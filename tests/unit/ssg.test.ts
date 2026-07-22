import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SSGBuilder } from '../../packages/ssg/src/SSGBuilder.js';
import { collectSSGRoutes } from '../../packages/ssg/src/RouteCollector.js';
import { generateSitemapXML, generateRobotsTxt } from '../../packages/ssg/src/SitemapGenerator.js';

const testTmpDir = path.resolve(process.cwd(), 'temp-ssg-test-dir');

function safeRmDir(dir: string) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore Windows file lock EPERM
    }
  }
}

describe('First-Class Static Site Generation Support (PR-29)', () => {
  beforeEach(() => {
    safeRmDir(testTmpDir);
    fs.mkdirSync(testTmpDir, { recursive: true });
  });

  afterEach(() => {
    safeRmDir(testTmpDir);
  });

  it('should map route URLs to output index.html paths', () => {
    const routes = collectSSGRoutes(['/', '/about', '/docs/faq'], 'dist');

    expect(routes[0].outputPath).toContain(path.join('dist', 'index.html'));
    expect(routes[1].outputPath).toContain(path.join('dist', 'about', 'index.html'));
    expect(routes[2].outputPath).toContain(path.join('dist', 'docs', 'faq', 'index.html'));
  });

  it('should generate valid sitemap XML and robots.txt files', () => {
    const xml = generateSitemapXML({ routes: ['/', '/about'] });
    expect(xml).toContain('<loc>https://example.com/</loc>');
    expect(xml).toContain('<loc>https://example.com/about</loc>');

    const robots = generateRobotsTxt('https://my-site.com');
    expect(robots).toContain('Sitemap: https://my-site.com/sitemap.xml');
  });

  it('should prerender static HTML pages and write sitemap & manifest cleanly', async () => {
    const builder = new SSGBuilder({
      enabled: true,
      routes: ['/', '/contact'],
      sitemap: true,
      robots: true,
      minifyHTML: true,
      outDir: testTmpDir,
    });

    const result = await builder.build(async (route) => {
      return `<!DOCTYPE html><html><body><h1>Page ${route}</h1></body></html>`;
    });

    expect(result.routesCount).toBe(2);
    expect(result.errorsCount).toBe(0);

    expect(fs.existsSync(path.join(testTmpDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(testTmpDir, 'contact', 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(testTmpDir, 'sitemap.xml'))).toBe(true);
    expect(fs.existsSync(path.join(testTmpDir, 'robots.txt'))).toBe(true);
    expect(fs.existsSync(path.join(testTmpDir, 'manifest.json'))).toBe(true);

    const contactHTML = fs.readFileSync(path.join(testTmpDir, 'contact', 'index.html'), 'utf-8');
    expect(contactHTML).toContain('Page /contact');
  });

  it('should continue prerendering remaining routes when one route throws an error', async () => {
    const builder = new SSGBuilder({
      enabled: true,
      routes: ['/', '/broken', '/good'],
      outDir: testTmpDir,
    });

    const result = await builder.build(async (route) => {
      if (route === '/broken') throw new Error('Render failed');
      return `<html><body>${route}</body></html>`;
    });

    expect(result.routesCount).toBe(3);
    expect(result.errorsCount).toBe(1);
    expect(fs.existsSync(path.join(testTmpDir, 'good', 'index.html'))).toBe(true);
  });
});
