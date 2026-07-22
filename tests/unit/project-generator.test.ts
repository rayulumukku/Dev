import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateSyntheticProject } from '../../packages/benchmark/src/generator/ProjectGenerator.js';
import { SeededPRNG } from '../../packages/benchmark/src/generator/Config.js';

const testTmpDir = path.resolve(process.cwd(), 'temp-project-generator-test');

describe('Deterministic Synthetic Project Generator (PR-18)', () => {
  beforeEach(() => {
    try {
      if (fs.existsSync(testTmpDir)) {
        fs.rmSync(testTmpDir, { recursive: true, force: true });
      }
    } catch {}
    fs.mkdirSync(testTmpDir, { recursive: true });
  });

  afterEach(() => {
    try {
      if (fs.existsSync(testTmpDir)) {
        fs.rmSync(testTmpDir, { recursive: true, force: true });
      }
    } catch {}
  });

  it('should generate deterministic PRNG numbers given the same seed', () => {
    const prng1 = new SeededPRNG(42);
    const prng2 = new SeededPRNG(42);

    expect(prng1.nextInt(1, 1000)).toBe(prng2.nextInt(1, 1000));
    expect(prng1.nextFloat()).toBe(prng2.nextFloat());
  });

  it('should generate byte-for-byte identical projects when given the same seed', () => {
    const dirA = path.join(testTmpDir, 'projectA');
    const dirB = path.join(testTmpDir, 'projectB');

    generateSyntheticProject({ projectName: 'app', targetDir: dirA, scale: 'small', seed: 42 });
    generateSyntheticProject({ projectName: 'app', targetDir: dirB, scale: 'small', seed: 42 });

    const fileA = fs.readFileSync(path.join(dirA, 'src/assets/asset_0.svg'), 'utf-8');
    const fileB = fs.readFileSync(path.join(dirB, 'src/assets/asset_0.svg'), 'utf-8');

    expect(fileA).toBe(fileB);
  });

  it('should generate small, medium, and large scale project hierarchies', () => {
    const smallDir = path.join(testTmpDir, 'small-app');
    generateSyntheticProject({ projectName: 'small-app', targetDir: smallDir, scale: 'small', seed: 100 });

    expect(fs.existsSync(path.join(smallDir, 'src/components/Component49.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(smallDir, 'src/assets/asset_24.svg'))).toBe(true);
    expect(fs.existsSync(path.join(smallDir, 'src/routes/index.ts'))).toBe(true);
  });

  it('should generate valid package.json and .env configuration', () => {
    const targetDir = path.join(testTmpDir, 'env-app');
    generateSyntheticProject({ projectName: 'env-app', targetDir, scale: 'small', seed: 777 });

    const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'));
    expect(pkg.name).toBe('env-app');

    const env = fs.readFileSync(path.join(targetDir, '.env'), 'utf-8');
    expect(env).toContain('VITE_BENCHMARK_SEED=777');
  });
});
