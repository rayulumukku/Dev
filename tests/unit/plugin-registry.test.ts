import { describe, it, expect } from 'vitest';
import {
  PluginManifestParser,
  IntegrityVerifier,
  DependencyResolver,
  PluginSearchEngine,
  RegistryClient,
} from '../../packages/plugin-registry/src/index.js';
import {
  LockfileManager,
  PluginInstaller,
  PluginUninstaller,
  PluginUpdater,
  PluginLister,
  PluginDoctor,
  PluginPublisher,
} from '../../packages/plugin-manager/src/index.js';
import fs from 'fs';
import path from 'path';

describe('Official Ray Plugin Registry & Package Manager (PR-34)', () => {
  const tempDir = path.join(process.cwd(), 'temp-registry-test');

  it('1. should parse and validate ray-plugin.json manifests', () => {
    const raw = JSON.stringify({
      name: '@ray/plugin-test',
      version: '1.0.0',
      sdk: '^1.0.0',
      description: 'Test description',
      ray: { minimum: '1.0.0' },
    });

    const manifest = PluginManifestParser.parse(raw);
    expect(manifest.name).toBe('@ray/plugin-test');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.ray.minimum).toBe('1.0.0');
  });

  it('2. should verify checksums and check SDK compatibility', () => {
    const manifest = {
      name: '@ray/plugin-test',
      version: '1.0.0',
      sdk: '^1.0.0',
      ray: { minimum: '1.0.0' },
    };

    const result = IntegrityVerifier.verifyManifest(manifest, '1.0.0');
    expect(result.valid).toBe(true);
    expect(result.checksum).toBeDefined();

    const invalidResult = IntegrityVerifier.verifyManifest(manifest, '0.9.0');
    expect(invalidResult.valid).toBe(false);
  });

  it('3. should search plugins in catalog by keyword or name', async () => {
    const client = new RegistryClient();
    const results = await client.search('mdx');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('@ray/plugin-mdx');
  });

  it('4. should detect circular plugin dependencies', () => {
    const circularGraph = {
      'plugin-a': ['plugin-b'],
      'plugin-b': ['plugin-c'],
      'plugin-c': ['plugin-a'],
    };

    const cycle = DependencyResolver.detectCircular(circularGraph);
    expect(cycle).not.toBeNull();
    expect(cycle).toContain('plugin-a');
  });

  it('5. should install plugins, generate lockfile entries, and manage .ray/plugins/', () => {
    const installer = new PluginInstaller({ projectRoot: tempDir });
    const res = installer.install('@ray/plugin-test', '1.2.0');

    expect(res.success).toBe(true);
    expect(res.name).toBe('@ray/plugin-test');

    const lockfileManager = new LockfileManager(tempDir);
    const lockfile = lockfileManager.load();
    expect(lockfile.plugins['@ray/plugin-test']).toBeDefined();
    expect(lockfile.plugins['@ray/plugin-test'].version).toBe('1.2.0');

    const lister = new PluginLister(tempDir);
    const list = lister.list();
    expect(Object.keys(list)).toContain('@ray/plugin-test');
  });

  it('6. should run plugin update and lockfile maintenance', () => {
    const updater = new PluginUpdater(tempDir);
    const res = updater.update();
    expect(res.updatedCount).toBeGreaterThan(0);
  });

  it('7. should run doctor diagnostics reporting healthy status or errors', () => {
    const doctor = new PluginDoctor(tempDir);
    const report = doctor.diagnose('1.0.0');
    expect(report.healthy).toBe(true);
  });

  it('8. should validate publishing requirements cleanly', () => {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'package.json'), JSON.stringify({ name: 'my-plugin', version: '1.0.0' }));
    fs.writeFileSync(path.join(tempDir, 'ray-plugin.json'), JSON.stringify({
      name: 'my-plugin',
      version: '1.0.0',
      sdk: '^1.0.0',
      description: 'Desc',
      keywords: ['test'],
      ray: { minimum: '1.0.0' },
    }));

    const publisher = new PluginPublisher(tempDir);
    const pubRes = publisher.publish();
    expect(pubRes.valid).toBe(true);
  });

  it('9. should uninstall plugins and clean lockfile', () => {
    const uninstaller = new PluginUninstaller(tempDir);
    uninstaller.uninstall('@ray/plugin-test');

    const lister = new PluginLister(tempDir);
    const list = lister.list();
    expect(Object.keys(list)).not.toContain('@ray/plugin-test');

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
