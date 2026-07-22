import { describe, it, expect } from 'vitest';
import { BoundaryResolver } from '../../packages/react-server/src/BoundaryResolver.js';
import { ClientReferenceManifestManager } from '../../packages/react-server/src/ClientReferenceManifest.js';
import { FlightProtocol } from '../../packages/react-server/src/FlightProtocol.js';
import { FlightRenderer } from '../../packages/react-server/src/FlightRenderer.js';
import { RSCCompiler } from '../../packages/react-server/src/RSCCompiler.js';
import { ServerModuleGraph } from '../../packages/react-server/src/ServerModuleGraph.js';

describe('Experimental React Server Components (RSC) (PR-39)', () => {
  it('1. should detect "use client" and "use server" component boundaries', () => {
    expect(BoundaryResolver.resolveBoundary('"use client";\nexport function C() {}')).toBe('client');
    expect(BoundaryResolver.resolveBoundary('"use server";\nexport function S() {}')).toBe('server');
    expect(BoundaryResolver.resolveBoundary('export function Shared() {}')).toBe('shared');
  });

  it('2. should report invalid boundary imports via diagnostics', () => {
    const check = BoundaryResolver.validateBoundaryImport('client', 'server', 'ClientComp.jsx', 'ServerComp.jsx');
    expect(check.valid).toBe(false);
    expect(check.error).toContain('Invalid boundary crossing');
  });

  it('3. should generate client reference manifest entries', () => {
    const manager = new ClientReferenceManifestManager();
    const ref = manager.registerClientReference('src/Counter.jsx', 'Counter', 'chunk-client.js');

    expect(ref.id).toBe('src/Counter.jsx#Counter');
    expect(ref.chunks).toContain('chunk-client.js');

    const manifestJson = manager.toJSON();
    expect(manifestJson).toContain('src/Counter.jsx');
  });

  it('4. should encode and decode Flight protocol payload lines', () => {
    const encoded = FlightProtocol.encodePayload({
      id: '0',
      type: 'client-ref',
      data: ['chunk.js', 'Counter'],
    });

    expect(encoded).toContain('0:I:');

    const decoded = FlightProtocol.decodePayload(encoded.trim());
    expect(decoded).not.toBeNull();
    expect(decoded?.type).toBe('client-ref');
    expect(decoded?.data[1]).toBe('Counter');
  });

  it('5. should render Flight payload stream from component tree', async () => {
    const stream = await FlightRenderer.renderToFlightStream({ type: 'div' });
    expect(stream).toContain('RSC Stream Payload');
  });

  it('6. should compile client component with reference proxy', () => {
    const clientCode = '"use client";\nexport function Counter() {}';
    const compiled = RSCCompiler.compile(clientCode, 'Counter.jsx', { enabled: true });

    expect(compiled.boundary).toBe('client');
    expect(compiled.code).toContain('createClientReference');
  });

  it('7. should manage server module boundaries in module graph', () => {
    const graph = new ServerModuleGraph();
    graph.registerModuleBoundary('Server.jsx', 'server');
    expect(graph.getModuleBoundary('Server.jsx')).toBe('server');
  });
});
