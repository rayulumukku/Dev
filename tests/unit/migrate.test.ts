import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { detectConfig } from '../../packages/cli/src/migration/detector.js';
import { runMigrateCommand } from '../../packages/cli/src/commands/migrate.js';

describe('Migrate Configuration Detection & Command Tests', () => {
  const testDir = path.resolve(process.cwd(), 'temp-migrate-test');

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

  it('should detect vite.config.ts', () => {
    const configPath = path.join(testDir, 'vite.config.ts');
    fs.writeFileSync(configPath, 'export default {};');

    const result = detectConfig(testDir);
    expect(result.found).toBe(true);
    expect(result.framework).toBe('Vite');
    expect(result.configFile).toBe('vite.config.ts');
    expect(result.configPath).toBe(configPath);
    expect(result.rootDir).toBe(testDir);
  });

  it('should detect vite.config.js and vite.config.mjs', () => {
    const configJs = path.join(testDir, 'vite.config.js');
    fs.writeFileSync(configJs, 'module.exports = {};');

    const resultJs = detectConfig(testDir);
    expect(resultJs.found).toBe(true);
    expect(resultJs.framework).toBe('Vite');
    expect(resultJs.configFile).toBe('vite.config.js');

    fs.rmSync(configJs);

    const configMjs = path.join(testDir, 'vite.config.mjs');
    fs.writeFileSync(configMjs, 'export default {};');

    const resultMjs = detectConfig(testDir);
    expect(resultMjs.found).toBe(true);
    expect(resultMjs.framework).toBe('Vite');
    expect(resultMjs.configFile).toBe('vite.config.mjs');
  });

  it('should detect webpack.config.js, webpack.config.ts, and webpack.config.mjs', () => {
    const configJs = path.join(testDir, 'webpack.config.js');
    fs.writeFileSync(configJs, 'module.exports = {};');

    const resultJs = detectConfig(testDir);
    expect(resultJs.found).toBe(true);
    expect(resultJs.framework).toBe('Webpack');
    expect(resultJs.configFile).toBe('webpack.config.js');

    fs.rmSync(configJs);

    const configTs = path.join(testDir, 'webpack.config.ts');
    fs.writeFileSync(configTs, 'export default {};');

    const resultTs = detectConfig(testDir);
    expect(resultTs.found).toBe(true);
    expect(resultTs.framework).toBe('Webpack');
    expect(resultTs.configFile).toBe('webpack.config.ts');

    fs.rmSync(configTs);

    const configMjs = path.join(testDir, 'webpack.config.mjs');
    fs.writeFileSync(configMjs, 'export default {};');

    const resultMjs = detectConfig(testDir);
    expect(resultMjs.found).toBe(true);
    expect(resultMjs.framework).toBe('Webpack');
    expect(resultMjs.configFile).toBe('webpack.config.mjs');
  });

  it('should return found=false when no supported config exists', () => {
    const result = detectConfig(testDir);
    expect(result.found).toBe(false);
    expect(result.framework).toBeUndefined();
    expect(result.configFile).toBeUndefined();
    expect(result.rootDir).toBe(testDir);
  });

  it('should runMigrateCommand with exit code 0 when config exists and print report', () => {
    fs.writeFileSync(path.join(testDir, 'vite.config.ts'), 'export default {};');

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = runMigrateCommand({ cwd: testDir });

    expect(result.exitCode).toBe(0);
    expect(result.detection.found).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(`✓ Project Root: ${testDir}`));
    expect(consoleSpy).toHaveBeenCalledWith('✓ Detected: Vite');
    expect(consoleSpy).toHaveBeenCalledWith('✓ Config: vite.config.ts');

    consoleSpy.mockRestore();
  });

  it('should runMigrateCommand with exit code 1 when no config exists and print error report', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = runMigrateCommand({ cwd: testDir });

    expect(result.exitCode).toBe(1);
    expect(result.detection.found).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('✗ No supported configuration found.');

    consoleSpy.mockRestore();
  });
});
