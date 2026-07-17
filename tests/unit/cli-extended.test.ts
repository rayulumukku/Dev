import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runCreateProject } from '../../packages/cli/src/create.js';
import { formatCodeError } from '../../packages/core/src/diagnostics/errorFormatter.js';

describe('CLI Extended and Diagnostic Tests', () => {
  const testDir = path.resolve(process.cwd(), 'temp-cli-test');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should scaffold project in current directory using dot name', () => {
    const projDir = path.join(testDir, 'my-dot-app');
    fs.mkdirSync(projDir, { recursive: true });

    runCreateProject(projDir, '.', 'react');

    expect(fs.existsSync(path.join(projDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(projDir, '.gitignore'))).toBe(true);
    expect(fs.existsSync(path.join(projDir, 'ray.config.ts'))).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(path.join(projDir, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('my-dot-app');
  });

  it('should scaffold Svelte configuration with official plugin import', () => {
    const projDir = path.join(testDir, 'my-svelte-app');
    runCreateProject(testDir, 'my-svelte-app', 'svelte');

    expect(fs.existsSync(path.join(projDir, 'ray.config.ts'))).toBe(true);
    const config = fs.readFileSync(path.join(projDir, 'ray.config.ts'), 'utf-8');
    expect(config).toContain("import { defineConfig, svelte } from '@ray/core';");
    expect(config).toContain("svelte()");
  });

  it('should scaffold Vue configuration with official plugin import', () => {
    const projDir = path.join(testDir, 'my-vue-app');
    runCreateProject(testDir, 'my-vue-app', 'vue');

    expect(fs.existsSync(path.join(projDir, 'ray.config.ts'))).toBe(true);
    const config = fs.readFileSync(path.join(projDir, 'ray.config.ts'), 'utf-8');
    expect(config).toContain("import { defineConfig, vue } from '@ray/core';");
    expect(config).toContain("vue()");
  });

  it('should scaffold Solid configuration with official plugin import', () => {
    const projDir = path.join(testDir, 'my-solid-app');
    runCreateProject(testDir, 'my-solid-app', 'solid');

    expect(fs.existsSync(path.join(projDir, 'ray.config.ts'))).toBe(true);
    const config = fs.readFileSync(path.join(projDir, 'ray.config.ts'), 'utf-8');
    expect(config).toContain("import { defineConfig, solid } from '@ray/core';");
    expect(config).toContain("solid()");
  });

  it('should format code errors with ANSI frames and suggest solutions', () => {
    const code = `const x = 5;\nif (x < 10) {\n  console.log("mismatched tag\n}`;
    const result = formatCodeError({
      message: 'Mismatched JSX tags or expected closing tag',
      code,
      filePath: 'src/App.jsx',
      line: 3,
      column: 15
    });

    expect(result.frame).toContain('Error in App.jsx:3:15');
    expect(result.frame).toContain('console.log("mismatched tag');
    expect(result.suggestion).toContain('Ensure all JSX opening tags are paired');
  });
});
