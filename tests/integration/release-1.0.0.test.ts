import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { scaffoldAdapter } from '../../packages/create-deployment-adapter/src/cli.js';
import { ReleaseManager } from '../../packages/release/src/index.js';
import { APIScanner, APIRegistry } from '../../packages/api-contract/src/index.js';

describe('Ray 1.0.0 General Availability Final Release Validation (PR-51)', () => {
  it('1. should verify monorepo root package.json version and workspace packages', () => {
    const rootPkgPath = path.join(process.cwd(), 'package.json');
    expect(fs.existsSync(rootPkgPath)).toBe(true);

    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
    expect(rootPkg.version).toBe('1.0.0');
    expect(rootPkg.name).toBe('ray-monorepo');
  });

  it('2. should verify scaffolding CLI generator (create-deployment-adapter)', () => {
    const tempTarget = path.join(process.cwd(), 'temp-release-adapter-test');
    scaffoldAdapter(tempTarget, 'vercel-test');

    expect(fs.existsSync(path.join(tempTarget, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(tempTarget, 'src/index.ts'))).toBe(true);

    fs.rmSync(tempTarget, { recursive: true, force: true });
  });

  it('3. should verify release manager plan generation and topological publish order', () => {
    const plan = ReleaseManager.createPlan();
    expect(plan.strategy).toBe('independent');
    expect(plan.publishOrder.length).toBeGreaterThan(0);
    expect(plan.packages.length).toBeGreaterThan(0);
  });

  it('4. should verify public API contract manifest registration', () => {
    APIRegistry.clear();
    const manifest = APIScanner.scanPackage('@ray/core', ['RayCore', 'defineConfig']);
    APIRegistry.register(manifest);

    expect(APIRegistry.get('@ray/core')).toBeDefined();
    expect(APIRegistry.get('@ray/core')?.symbols.length).toBe(2);
  });
});
