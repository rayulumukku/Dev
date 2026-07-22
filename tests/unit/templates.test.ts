import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { renderProject } from '../../packages/create-ray/src/renderer.js';

const testTmpDir = path.resolve(process.cwd(), 'temp-templates-test');

describe('Official Project Templates in create-ray (PR-16)', () => {
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

  it('should render react-ts template with correct placeholder replacement', () => {
    const targetDir = path.join(testTmpDir, 'my-react-app');
    renderProject({
      projectName: 'my-react-app',
      targetDir,
      template: 'react-ts',
      framework: 'react',
      language: 'ts',
      styling: 'none',
      packageManager: 'npm',
    });

    expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'src/App.tsx'))).toBe(true);

    const readme = fs.readFileSync(path.join(targetDir, 'README.md'), 'utf-8');
    expect(readme).toContain('my-react-app');
  });

  it('should render react-tailwind template with Tailwind configuration', () => {
    const targetDir = path.join(testTmpDir, 'my-tailwind-app');
    renderProject({
      projectName: 'my-tailwind-app',
      targetDir,
      template: 'react-tailwind',
      framework: 'react',
      language: 'ts',
      styling: 'tailwind',
      packageManager: 'pnpm',
    });

    expect(fs.existsSync(path.join(targetDir, 'tailwind.config.js'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'src/index.css'))).toBe(true);
  });

  it('should render vue-ts template with @ray/plugin-vue configuration', () => {
    const targetDir = path.join(testTmpDir, 'my-vue-app');
    renderProject({
      projectName: 'my-vue-app',
      targetDir,
      template: 'vue-ts',
      framework: 'vue',
      language: 'ts',
      styling: 'none',
      packageManager: 'yarn',
    });

    expect(fs.existsSync(path.join(targetDir, 'src/App.vue'))).toBe(true);
    const config = fs.readFileSync(path.join(targetDir, 'ray.config.ts'), 'utf-8');
    expect(config).toContain('@ray/plugin-vue');
  });

  it('should render minimal template with zero dependencies', () => {
    const targetDir = path.join(testTmpDir, 'my-minimal-app');
    renderProject({
      projectName: 'my-minimal-app',
      targetDir,
      template: 'minimal',
      framework: 'minimal',
      language: 'js',
      styling: 'none',
      packageManager: 'bun',
    });

    expect(fs.existsSync(path.join(targetDir, 'src/main.js'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'src/styles.css'))).toBe(true);
  });
});
