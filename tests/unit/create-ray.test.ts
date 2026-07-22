import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { validateProjectName, validateTargetDirectory } from '../../packages/create-ray/src/validator.js';
import { detectPackageManager, getInstallCommand } from '../../packages/create-ray/src/packageManager.js';
import { renderProject } from '../../packages/create-ray/src/renderer.js';
import { runCLI } from '../../packages/create-ray/src/cli.js';

const testTmpDir = path.resolve(process.cwd(), 'temp-create-ray-engine-test');

describe('Full create-ray Scaffolding Engine (PR-15)', () => {
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

  it('should validate project names correctly', () => {
    expect(validateProjectName('valid-name').valid).toBe(true);
    expect(validateProjectName('INVALID_NAME').valid).toBe(false);
    expect(validateProjectName('').valid).toBe(false);
  });

  it('should detect package manager from environment', () => {
    expect(detectPackageManager({ npm_config_user_agent: 'pnpm/8.0.0 node/v20.0.0' })).toBe('pnpm');
    expect(detectPackageManager({ npm_config_user_agent: 'yarn/1.22.0' })).toBe('yarn');
    expect(detectPackageManager({ npm_config_user_agent: 'bun/1.0.0' })).toBe('bun');
    expect(detectPackageManager({})).toBe('npm');
  });

  it('should generate correct installation commands for each package manager', () => {
    expect(getInstallCommand('npm')).toBe('npm install');
    expect(getInstallCommand('pnpm')).toBe('pnpm install');
    expect(getInstallCommand('yarn')).toBe('yarn');
    expect(getInstallCommand('bun')).toBe('bun install');
  });

  it('should render project files with placeholder replacement and framework configuration', () => {
    const targetDir = path.join(testTmpDir, 'test-app');
    renderProject({
      projectName: 'test-app',
      targetDir,
      framework: 'react',
      language: 'ts',
      styling: 'tailwind',
      packageManager: 'pnpm',
    });

    expect(fs.existsSync(path.join(targetDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, 'ray.config.ts'))).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('test-app');
    expect(pkg.devDependencies['tailwindcss']).toBeDefined();
  });

  it('should respect overwrite protection and validate target directory', () => {
    const targetDir = path.join(testTmpDir, 'existing-app');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, 'file.txt'), 'content');

    expect(validateTargetDirectory(targetDir, false).valid).toBe(false);
    expect(validateTargetDirectory(targetDir, true).valid).toBe(true);
  });

  it('should run full CLI orchestration end-to-end', async () => {
    const targetDir = path.join(testTmpDir, 'cli-test-app');
    await runCLI([targetDir, '--framework', 'vue', '--lang', 'js', '--pm', 'yarn']);

    expect(fs.existsSync(path.join(targetDir, 'src/App.vue'))).toBe(true);
  });
});
