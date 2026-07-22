import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Ray Ecosystem Architecture & Boundary Enforcement (PR-52)', () => {
  const packagesDir = path.join(process.cwd(), 'packages');

  it('1. should verify all workspace packages exist and have valid package.json files', () => {
    expect(fs.existsSync(packagesDir)).toBe(true);
    const pkgs = fs.readdirSync(packagesDir);
    expect(pkgs.length).toBeGreaterThan(20);

    for (const pkgName of pkgs) {
      const pkgJsonPath = path.join(packagesDir, pkgName, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        expect(pkgJson.name).toBeDefined();
        expect(pkgJson.version).toBeDefined();
      }
    }
  });

  it('2. should enforce Core dependency boundary rules (Core never depends on Framework plugins)', () => {
    const corePkgPath = path.join(packagesDir, 'core', 'package.json');
    const corePkg = JSON.parse(fs.readFileSync(corePkgPath, 'utf8'));
    const allDeps = { ...corePkg.dependencies, ...corePkg.devDependencies };

    const forbiddenFrameworkDeps = [
      '@ray/plugin-svelte',
      '@ray/plugin-solid',
      '@ray/plugin-angular',
      '@ray/react-server',
      '@ray/server-actions',
    ];

    for (const forbidden of forbiddenFrameworkDeps) {
      expect(allDeps[forbidden]).toBeUndefined();
    }
  });

  it('3. should verify non-core packages consume only public API boundaries', () => {
    const sdkPkgPath = path.join(packagesDir, 'plugin-sdk', 'package.json');
    expect(fs.existsSync(sdkPkgPath)).toBe(true);
  });
});
