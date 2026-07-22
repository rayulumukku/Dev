import { describe, it, expect, beforeEach } from 'vitest';
import {
  defineFramework,
  RuntimeRegistry,
  CapabilityRegistry,
  DevRuntime,
  HMRRuntime,
  SSRRuntime,
  HydrationRuntime,
  ManifestRuntime,
  DiagnosticsRuntime,
} from '../../packages/framework-runtime/src/index.js';

describe('Framework Runtime Abstraction Layer (PR-41)', () => {
  beforeEach(() => {
    RuntimeRegistry.clear();
  });

  it('1. should register framework adapters via defineFramework()', () => {
    const adapter = defineFramework({
      name: 'test-framework',
      version: '1.0.0',
      capabilities: {
        devRuntime: true,
        hmr: true,
        ssr: true,
      },
    });

    expect(adapter.name).toBe('test-framework');
    expect(RuntimeRegistry.getAdapter('test-framework')).toBe(adapter);
  });

  it('2. should validate framework capability negotiation', () => {
    const adapter = defineFramework({
      name: 'react-like',
      version: '1.0.0',
      capabilities: {
        ssr: true,
        hmr: true,
      },
    });

    expect(CapabilityRegistry.validateCapabilities(adapter, ['ssr', 'hmr'])).toBe(true);
    expect(CapabilityRegistry.validateCapabilities(adapter, ['serverComponents'])).toBe(false);

    const activeCaps = CapabilityRegistry.getSupportedCapabilities(adapter);
    expect(activeCaps).toContain('ssr');
    expect(activeCaps).toContain('hmr');
  });

  it('3. should support multiple framework coexistence in monorepos', () => {
    defineFramework({
      name: 'svelte-adapter',
      version: '1.0.0',
      capabilities: { devRuntime: true },
    });
    defineFramework({
      name: 'solid-adapter',
      version: '1.0.0',
      capabilities: { devRuntime: true },
    });

    expect(RuntimeRegistry.getAdapters().length).toBe(2);

    const svelteActive = RuntimeRegistry.resolveActiveAdapters('App.svelte');
    expect(svelteActive.some(a => a.name === 'svelte-adapter')).toBe(true);

    const solidActive = RuntimeRegistry.resolveActiveAdapters('App.solid.tsx');
    expect(solidActive.some(a => a.name === 'solid-adapter')).toBe(true);
  });

  it('4. should trigger dev runtime and HMR lifecycle updates', async () => {
    let hmrTriggered = false;

    defineFramework({
      name: 'mock-framework',
      version: '1.0.0',
      capabilities: { devRuntime: true, hmr: true },
      hooks: {
        transform: (code) => ({ code: `/* mock */ ${code}` }),
        onHMRUpdate: (file) => {
          hmrTriggered = true;
        },
      },
    });

    const transformed = await DevRuntime.transformFile('const x = 1;', 'App.vue');
    expect(transformed?.code).toContain('/* mock */');

    HMRRuntime.notifyHMRUpdate('App.vue');
    expect(hmrTriggered).toBe(true);
  });

  it('5. should execute SSR rendering lifecycle and hydration metadata', async () => {
    defineFramework({
      name: 'ssr-framework',
      version: '1.0.0',
      capabilities: { ssr: true },
      hooks: {
        renderSSR: async () => ({ html: '<div id="ssr-root">SSR Content</div>' }),
      },
    });

    const res = await SSRRuntime.renderModule({});
    expect(res.html).toContain('SSR Content');

    const meta = HydrationRuntime.getHydrationMetadata('ssr-framework');
    expect(meta.adapter).toBe('ssr-framework');
    expect(meta.hydratable).toBe(true);
  });

  it('6. should aggregate diagnostics and generate combined manifests', () => {
    defineFramework({
      name: 'diag-framework',
      version: '1.0.0',
      capabilities: { diagnostics: true },
      hooks: {
        onDiagnostics: (id, code) => [{ id, message: 'Warning diagnostic' }],
        generateManifest: () => ({ routes: ['/'] }),
      },
    });

    const diags = DiagnosticsRuntime.collectDiagnostics('App.tsx', 'code');
    expect(diags.length).toBe(1);
    expect(diags[0].message).toBe('Warning diagnostic');

    const manifest = ManifestRuntime.generateCombinedManifest();
    expect(manifest['diag-framework']).toBeDefined();
    expect(manifest['diag-framework'].routes).toContain('/');
  });
});
