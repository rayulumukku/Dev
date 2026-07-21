import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { detectConfig, loadConfig } from '../../packages/migrate/src/index.js';
import { runMigrateCommand } from '../../packages/cli/src/commands/migrate.js';

describe('Migrate Configuration Detection & Loading Layer Tests', () => {
  const testDir = path.resolve(process.cwd(), 'temp-migrate-test-pr2');

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

  // --- Detection Tests ---

  it('should detect single vite.config.ts', () => {
    const configPath = path.join(testDir, 'vite.config.ts');
    fs.writeFileSync(configPath, 'export default {};');

    const result = detectConfig(testDir);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('vite');
    expect(result?.path).toBe(configPath);
  });

  it('should detect single webpack.config.js', () => {
    const configPath = path.join(testDir, 'webpack.config.js');
    fs.writeFileSync(configPath, 'module.exports = {};');

    const result = detectConfig(testDir);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('webpack');
    expect(result?.path).toBe(configPath);
  });

  it('should return null when no configuration file exists', () => {
    const result = detectConfig(testDir);
    expect(result).toBeNull();
  });

  it('should throw a descriptive error when multiple configuration files exist', () => {
    fs.writeFileSync(path.join(testDir, 'vite.config.ts'), 'export default {};');
    fs.writeFileSync(path.join(testDir, 'webpack.config.js'), 'module.exports = {};');

    expect(() => detectConfig(testDir)).toThrowError(
      /Multiple supported build configurations found/
    );
  });

  // --- Loading Tests ---

  it('should load JS configuration file', async () => {
    const configPath = path.join(testDir, 'vite.config.js');
    fs.writeFileSync(configPath, 'export default { root: "./src", publicDir: "static" };');

    const config = await loadConfig(configPath);
    expect(config).toBeDefined();
    expect(config.root).toBe('./src');
    expect(config.publicDir).toBe('static');
  });

  it('should load TS configuration file with type annotations and interface definitions', async () => {
    const configPath = path.join(testDir, 'vite.config.ts');
    const tsCode = `
      interface UserConfig {
        base: string;
        port: number;
      }
      type ModeAlias = string;

      const config: UserConfig = {
        base: '/app/',
        port: 8080 as number
      };
      export default config;
    `;
    fs.writeFileSync(configPath, tsCode);

    const config = await loadConfig(configPath);
    expect(config.base).toBe('/app/');
    expect(config.port).toBe(8080);
  });

  it('should load ESM configuration file (.mjs)', async () => {
    const configPath = path.join(testDir, 'vite.config.mjs');
    fs.writeFileSync(configPath, 'export default { mode: "production", sourcemap: true };');

    const config = await loadConfig(configPath);
    expect(config.mode).toBe('production');
    expect(config.sourcemap).toBe(true);
  });

  it('should load CJS configuration file (module.exports)', async () => {
    const configPath = path.join(testDir, 'webpack.config.js');
    fs.writeFileSync(
      configPath,
      'const path = require("path"); module.exports = { entry: "./src/main.js", target: "node" };'
    );

    const config = await loadConfig(configPath);
    expect(config.entry).toBe('./src/main.js');
    expect(config.target).toBe('node');
  });

  it('should invoke configuration function with minimal build environment', async () => {
    const configPath = path.join(testDir, 'vite.config.ts');
    const funcCode = `
      export default function defineConfig(env: any) {
        return {
          buildMode: env.mode,
          buildCommand: env.command,
          outDir: 'dist'
        };
      }
    `;
    fs.writeFileSync(configPath, funcCode);

    const config = await loadConfig(configPath);
    expect(config.buildMode).toBe('production');
    expect(config.buildCommand).toBe('build');
    expect(config.outDir).toBe('dist');
  });

  it('should normalize default exports (exports.default = ...)', async () => {
    const configPath = path.join(testDir, 'webpack.config.js');
    fs.writeFileSync(configPath, 'exports.default = { devtool: "eval-source-map" };');

    const config = await loadConfig(configPath);
    expect(config.devtool).toBe('eval-source-map');
  });

  it('should throw error for non-existent configuration file', async () => {
    await expect(loadConfig(path.join(testDir, 'does-not-exist.js'))).rejects.toThrowError(
      /Configuration file not found/
    );
  });

  it('should throw error for invalid non-object configuration export', async () => {
    const configPath = path.join(testDir, 'vite.config.js');
    fs.writeFileSync(configPath, 'export default "invalid-string";');

    await expect(loadConfig(configPath)).rejects.toThrowError(
      /invalid or not an object/
    );
  });

  // --- CLI Command Integration Tests ---

  it('should execute runMigrateCommand with exit code 0 when valid config loaded', async () => {
    fs.writeFileSync(path.join(testDir, 'vite.config.ts'), 'export default { server: { port: 5000 } };');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runMigrateCommand({ cwd: testDir });

    expect(result.exitCode).toBe(0);
    expect(result.data?.framework).toBe('vite');
    expect(result.data?.config.server.port).toBe(5000);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`✓ Project Root: ${testDir}`));
    expect(consoleSpy).toHaveBeenCalledWith('✓ Framework Detected: Vite');
    expect(consoleSpy).toHaveBeenCalledWith('✓ Config Loaded Successfully');

    consoleSpy.mockRestore();
  });

  it('should execute runMigrateCommand with exit code 1 when multiple configs exist', async () => {
    fs.writeFileSync(path.join(testDir, 'vite.config.ts'), 'export default {};');
    fs.writeFileSync(path.join(testDir, 'webpack.config.js'), 'module.exports = {};');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runMigrateCommand({ cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(consoleSpy).toHaveBeenCalledWith('✗ Failed to load configuration');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Multiple supported build configurations found'));

    consoleSpy.mockRestore();
  });

  it('should execute runMigrateCommand with exit code 1 when no config exists', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runMigrateCommand({ cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(consoleSpy).toHaveBeenCalledWith('✗ Failed to load configuration');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No supported configuration file found'));

    consoleSpy.mockRestore();
  });
});
