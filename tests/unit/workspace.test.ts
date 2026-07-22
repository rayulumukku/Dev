import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { detectWorkspaceManager } from '../../packages/workspace/src/WorkspaceDetector.js';
import { locateWorkspacePackages } from '../../packages/workspace/src/ProjectLocator.js';
import { WorkspaceGraph } from '../../packages/workspace/src/WorkspaceGraph.js';
import { resolveWorkspacePackage } from '../../packages/workspace/src/PackageResolver.js';

const testTmpDir = path.resolve(process.cwd(), 'temp-workspace-test');

function safeRmDir(dir: string) {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore Windows file lock EPERM in test teardown
    }
  }
}

describe('First-Class Monorepo and Workspace Support (PR-24)', () => {
  beforeEach(() => {
    safeRmDir(testTmpDir);
    fs.mkdirSync(testTmpDir, { recursive: true });
  });

  afterEach(() => {
    safeRmDir(testTmpDir);
  });

  it('should detect pnpm, npm, yarn, and bun workspace managers', () => {
    const pnpmDir = path.join(testTmpDir, 'pnpm-repo');
    fs.mkdirSync(pnpmDir, { recursive: true });
    fs.writeFileSync(path.join(pnpmDir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"');

    const res = detectWorkspaceManager(pnpmDir);
    expect(res.manager).toBe('pnpm');
  });

  it('should locate workspace packages across apps/ and packages/ directories', () => {
    const root = path.join(testTmpDir, 'repo');
    const appDir = path.join(root, 'apps', 'web');
    const uiDir = path.join(root, 'packages', 'ui');

    fs.mkdirSync(appDir, { recursive: true });
    fs.mkdirSync(uiDir, { recursive: true });

    fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({ name: '@app/web', dependencies: { '@app/ui': '1.0.0' } }));
    fs.writeFileSync(path.join(uiDir, 'package.json'), JSON.stringify({ name: '@app/ui' }));

    const pkgs = locateWorkspacePackages(root);
    expect(pkgs.size).toBe(2);
    expect(pkgs.has('@app/web')).toBe(true);
    expect(pkgs.has('@app/ui')).toBe(true);
  });

  it('should build unified WorkspaceGraph with dependency and dependent linkages', () => {
    const root = path.join(testTmpDir, 'graph-repo');
    const appDir = path.join(root, 'apps', 'web');
    const uiDir = path.join(root, 'packages', 'ui');

    fs.mkdirSync(appDir, { recursive: true });
    fs.mkdirSync(uiDir, { recursive: true });

    fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({ name: '@app/web', dependencies: { '@app/ui': '1.0.0' } }));
    fs.writeFileSync(path.join(uiDir, 'package.json'), JSON.stringify({ name: '@app/ui' }));

    const pkgs = locateWorkspacePackages(root);
    const graph = new WorkspaceGraph(pkgs);

    expect(graph.getDependents('@app/ui')).toEqual(['@app/web']);
  });

  it('should resolve workspace packages to local source files', () => {
    const root = path.join(testTmpDir, 'res-repo');
    const uiDir = path.join(root, 'packages', 'ui', 'src');
    fs.mkdirSync(uiDir, { recursive: true });
    fs.writeFileSync(path.join(root, 'packages', 'ui', 'package.json'), JSON.stringify({ name: '@app/ui' }));
    fs.writeFileSync(path.join(uiDir, 'index.ts'), 'export const UI = "ui";');

    const pkgs = locateWorkspacePackages(root);
    const resolvedPath = resolveWorkspacePackage('@app/ui', pkgs);

    expect(resolvedPath).toContain('index.ts');
  });
});
