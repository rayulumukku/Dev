import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { startDevServer } from '../../packages/dev-server/src/index.js';
import { studio } from '../../packages/core/src/index.js';

describe('Ray Studio Integration & API Tests', () => {
  const projectRoot = path.resolve(process.cwd(), 'tests/fixtures/studio-project');
  let serverInstance: any;
  let port = 3055;

  beforeAll(async () => {
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify({
      name: 'studio-project',
      version: '1.0.0',
      type: 'module'
    }, null, 2));

    fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'src/main.jsx'), 'export const a = 1;');

    // Start dev server for telemetry polling
    const res = await startDevServer({ port, ssr: false, mode: 'development' });
    serverInstance = res.server;
  });

  afterAll(async () => {
    if (serverInstance) {
      await new Promise<void>((resolve) => serverInstance.close(() => resolve()));
    }
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  const getUrlContent = (urlPath: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}${urlPath}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  };

  it('should serve studio dashboard page successfully', async () => {
    const html = await getUrlContent('/__ray/studio');
    expect(html).toContain('Ray Studio — Visual Compiler & Runtime Inspector');
    expect(html).toContain('id="graph-canvas"');
  });

  it('should expose transform stages lists', async () => {
    const raw = await getUrlContent('/__ray/transform-stages');
    const files = JSON.parse(raw);
    expect(Array.isArray(files)).toBe(true);
  });

  it('should expose full snapshot diagnostics details', async () => {
    const raw = await getUrlContent('/__ray/studio/diagnostics');
    const data = JSON.parse(raw);
    expect(data.metrics).toBeDefined();
    expect(data.metrics.heapUsed).toBeGreaterThan(0);
    expect(data.plugins).toBeDefined();
    expect(data.graph).toBeDefined();
    expect(data.studio).toBeDefined();
  });

  it('should support dynamic custom panel additions through studio API registry', () => {
    studio.addPanel('DB Inspector', { view: 'grid' });
    studio.addMetric('Custom Metric', 42);
    studio.addTimeline({ type: 'EVENT', timestamp: Date.now(), message: 'Custom Log' });

    const snap = studio.getSnapshot();
    expect(snap.panels).toHaveLength(1);
    expect(snap.panels[0].name).toBe('DB Inspector');
    expect(snap.metrics['Custom Metric']).toBe(42);
    expect(snap.timeline[0].message).toBe('Custom Log');
  });
});
