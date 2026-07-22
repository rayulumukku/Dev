import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateProject } from '../../packages/create-ray/src/templates/Generator.js';
import { runCreate } from '../../packages/create-ray/src/index.js';

const testTmpDir = path.resolve(process.cwd(), 'temp-create-ray-test');

describe('create-ray CLI Executable Package (PR-15)', () => {
  beforeEach(() => {
    if (fs.existsSync(testTmpDir)) {
      fs.rmSync(testTmpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testTmpDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testTmpDir)) {
      fs.rmSync(testTmpDir, { recursive: true, force: true });
    }
  });

  it('should scaffold a React TypeScript project template', () => {
    const targetDir = path.join(testTmpDir, 'my-react-app');
    generateProject({
      projectName: 'my-react-app',
      targetDir,
      template: 'react-ts',
    });

    expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'ray.config.ts'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'src/App.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'tsconfig.json'))).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'));
    expect(pkg.dependencies.react).toBeDefined();
  });

  it('should scaffold a Vue project template with @ray/plugin-vue', () => {
    const targetDir = path.join(testTmpDir, 'my-vue-app');
    generateProject({
      projectName: 'my-vue-app',
      targetDir,
      template: 'vue',
    });

    expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'src/App.vue'))).toBe(true);

    const config = fs.readFileSync(path.join(targetDir, 'ray.config.js'), 'utf-8');
    expect(config).toContain('@ray/plugin-vue');
  });

  it('should scaffold a library project template', () => {
    const targetDir = path.join(testTmpDir, 'my-lib');
    generateProject({
      projectName: 'my-lib',
      targetDir,
      template: 'library',
    });

    expect(fs.existsSync(path.join(targetDir, 'src/index.ts'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'index.html'))).toBe(false);

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'));
    expect(pkg.scripts.build).toContain('--lib');
  });

  it('should run runCreate with CLI arguments', async () => {
    const originalCwd = process.cwd();
    try {
      process.chdir(testTmpDir);
      await runCreate(['cli-app', '--template', 'react']);

      const targetDir = path.join(testTmpDir, 'cli-app');
      expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(targetDir, 'src/App.jsx'))).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should throw an error if target directory already exists and is non-empty', () => {
    const targetDir = path.join(testTmpDir, 'conflict-app');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'existing.txt'), 'hello');

    expect(() => {
      generateProject({
        projectName: 'conflict-app',
        targetDir,
        template: 'react',
      });
    }).toThrow('already exists');
  });
});
