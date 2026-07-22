import { describe, it, expect } from 'vitest';
import {
  EdgeRuntime,
  RuntimeCapabilities,
  RequestContext,
  ResponseContext,
  Streaming,
  Environment,
  Manifest,
  EdgeAdapter,
} from '../../packages/edge-runtime/src/index.js';

describe('Edge Runtime Foundation (PR-46)', () => {
  it('1. should initialize EdgeRuntime with node and edge target selection', () => {
    const nodeRt = new EdgeRuntime({ target: 'node' });
    expect(nodeRt.isEdgeTarget()).toBe(false);

    const edgeRt = new EdgeRuntime({ target: 'edge' });
    expect(edgeRt.isEdgeTarget()).toBe(true);
  });

  it('2. should analyze source code and detect unsupported Node.js built-ins', () => {
    const nodeCode = `import fs from 'fs'; const content = fs.readFileSync('test');`;
    const caps = RuntimeCapabilities.analyzeCode(nodeCode);

    expect(caps.unsupportedNodeModules).toContain('fs');
    expect(caps.streams).toBe(true);
    expect(caps.fetch).toBe(true);
  });

  it('3. should create Web-standard Request and Response contexts', async () => {
    const req = RequestContext.createRequest('https://example.com/api');
    expect(req.url).toBe('https://example.com/api');

    const res = ResponseContext.createResponse('Hello Edge', { status: 200 });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Hello Edge');
  });

  it('4. should handle streaming response chunks via ReadableStream', async () => {
    const res = EdgeAdapter.handleStream(['<h1>Stream Chunk 1</h1>', '<h2>Stream Chunk 2</h2>']);
    expect(res.body).toBeDefined();
    const text = await res.text();
    expect(text).toContain('Stream Chunk 1');
  });

  it('5. should generate runtime manifest for deployment', () => {
    const caps = RuntimeCapabilities.analyzeCode('');
    const manifest = Manifest.generateManifest('edge', 'dist/index.js', caps, ['dist/index.js']);

    expect(manifest.target).toBe('edge');
    expect(manifest.entry).toBe('dist/index.js');
    expect(manifest.capabilities.streams).toBe(true);
  });
});
