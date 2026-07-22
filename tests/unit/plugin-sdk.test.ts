import { describe, it, expect } from 'vitest';
import {
  definePlugin,
  createMockPluginContext,
  testTransformHook,
  testResolveHook,
  validatePlugin,
  generatePluginDocs,
  PluginVersion,
  validateConfig,
  PluginDiagnostics,
  createLogger,
} from '../../packages/plugin-sdk/src/index.js';
import { runCreatePlugin } from '../../packages/create-ray-plugin/src/cli.js';
import fs from 'fs';
import path from 'path';

describe('Official Ray Plugin SDK (PR-33)', () => {
  const tempDir = path.join(process.cwd(), 'temp-sdk-test');

  it('1. should define plugin with type safety and metadata', () => {
    const pluginFactory = definePlugin(() => ({
      name: 'my-test-plugin',
      version: '1.0.0',
      description: 'Test plugin description',
    }));

    const p = pluginFactory();
    expect(p.name).toBe('my-test-plugin');
    expect(p.version).toBe('1.0.0');
  });

  it('2. should negotiate version compatibility', () => {
    const res1 = PluginVersion.checkCompatibility({ minRayVersion: '1.0.0' }, '1.0.0');
    expect(res1.ok).toBe(true);

    const res2 = PluginVersion.checkCompatibility({ minRayVersion: '2.0.0' }, '1.0.0');
    expect(res2.ok).toBe(false);
    expect(res2.reason).toContain('lower than plugin required');

    const res3 = PluginVersion.checkCompatibility({ maxRayVersion: '1.5.0' }, '2.0.0');
    expect(res3.ok).toBe(false);
  });

  it('3. should parse and validate configuration options against schema', () => {
    const schema = {
      fields: {
        banner: { type: 'string' as const, required: true },
        count: { type: 'number' as const, required: false },
      },
    };

    const val1 = validateConfig({ banner: 'Header' }, schema);
    expect(val1.valid).toBe(true);

    const val2 = validateConfig({}, schema);
    expect(val2.valid).toBe(false);
    expect(val2.errors.length).toBeGreaterThan(0);
  });

  it('4. should collect diagnostics and handle logging', () => {
    const diag = new PluginDiagnostics();
    diag.warn('W001', 'Warning message');
    diag.error('E001', 'Error message');

    expect(diag.hasErrors()).toBe(true);
    expect(diag.getDiagnostics().length).toBe(2);

    const logger = createLogger('my-plugin');
    expect(logger).toBeDefined();
  });

  it('5. should run plugin testing harness hooks', async () => {
    const plugin = definePlugin(() => ({
      name: 'test-transform',
      async transform(code, id) {
        if (!id.endsWith('.txt')) return null;
        return { code: `TRANSD:${code}` };
      },
      async resolveId(id) {
        if (id === 'virtual:test') return '\0virtual:test';
        return null;
      },
    }))();

    const mockCtx = createMockPluginContext('test-transform');
    const transformRes = await testTransformHook(plugin, 'hello', 'doc.txt', mockCtx);

    expect(typeof transformRes === 'object' && transformRes?.code).toBe('TRANSD:hello');

    const resolveRes = await testResolveHook(plugin, 'virtual:test', undefined, mockCtx);
    expect(resolveRes).toBe('\0virtual:test');
  });

  it('6. should validate plugin object structure and hooks', () => {
    const plugin = {
      name: 'valid-plugin',
      transform: () => null,
      invalidHookName: 'not-a-hook',
    };

    const report = validatePlugin(plugin);
    expect(report.valid).toBe(true);
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it('7. should generate plugin API markdown documentation', () => {
    const plugin = {
      name: 'docs-plugin',
      version: '1.2.0',
      description: 'Generates API docs.',
      author: 'Ray Core Team',
      schema: {
        fields: {
          header: { type: 'string', required: true, description: 'Text header' },
        },
      },
    };

    const docs = generatePluginDocs(plugin);
    expect(docs).toContain('# docs-plugin');
    expect(docs).toContain('Text header');
    expect(docs).toContain('Configuration Options');
  });

  it('8. should scaffold new plugins via create-ray-plugin runner', () => {
    const res = runCreatePlugin(tempDir, 'my-scaffold-plugin', 'transform');

    expect(fs.existsSync(path.join(res.dir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(res.dir, 'src/index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(res.dir, 'src/index.test.ts'))).toBe(true);

    const indexContent = fs.readFileSync(path.join(res.dir, 'src/index.ts'), 'utf-8');
    expect(indexContent).toContain('definePlugin');

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
