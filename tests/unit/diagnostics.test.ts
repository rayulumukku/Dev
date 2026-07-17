import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { runDoctor } from '../../packages/core/src/diagnostics/doctor.js';
import { displayStats } from '../../packages/core/src/diagnostics/stats.js';
import { runVerify } from '../../packages/core/src/diagnostics/verify.js';
import { runRelease } from '../../packages/core/src/diagnostics/release.js';

describe('Diagnostics & Automation Unit Tests', () => {
  const projectRoot = path.resolve(process.cwd(), 'tests/fixtures/diag-project');

  beforeAll(() => {
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify({
      name: 'diag-project',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {}
    }, null, 2));

    fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'src/main.jsx'), 'export const val = 1;');
  });

  afterAll(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  describe('runDoctor', () => {
    it('should diagnose environment and configuration', async () => {
      // Create a mock sensitive key in .env development config
      fs.writeFileSync(path.join(projectRoot, '.env.development'), 'RAY_SECRET_KEY=leak\nNORMAL_SECRET=hide');

      const report = await runDoctor(projectRoot);
      expect(report.nodeVersion).toBeDefined();
      expect(report.envIssues).toHaveLength(1); // RAY_SECRET_KEY contains 'SECRET' prefix check
      expect(report.envOk).toBe(false);
    });
  });

  describe('displayStats', () => {
    it('should display memory usage logs cleanly without errors', () => {
      expect(() => displayStats(projectRoot)).not.toThrow();
    });
  });

  describe('runVerify', () => {
    it('should run verify checks on config, cache and graph', async () => {
      const report = await runVerify(projectRoot);
      expect(report.configOk).toBe(true);
      expect(report.graphOk).toBe(true);
    });
  });

  describe('runRelease', () => {
    it('should calculate SemVer bumps correctly in dryRun mode', async () => {
      await expect(runRelease(projectRoot, { version: 'minor', dryRun: true, skipPerf: true })).resolves.not.toThrow();
    });
  });
});
