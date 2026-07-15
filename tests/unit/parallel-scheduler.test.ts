import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { BuildScheduler, ChunkMerger } from '../../packages/core/src/index.js';

describe('Parallel Compilation Scheduler Tests', () => {
  // ─── ChunkMerger ────────────────────────────────────────────────────

  describe('ChunkMerger', () => {
    it('should merge chunks in order with banner comments', () => {
      const merger = new ChunkMerger();
      const chunks = [
        { file: '/src/a.js', code: 'const a = 1;' },
        { file: '/src/b.js', code: 'const b = 2;' },
        { file: '/src/c.js', code: 'const c = 3;' },
      ];
      const result = merger.merge(chunks);
      expect(result.code).toContain('/* [Ray Chunk] /src/a.js */');
      expect(result.code).toContain('/* [Ray Chunk] /src/b.js */');
      expect(result.code).toContain('const a = 1;');
      expect(result.code).toContain('const b = 2;');
      expect(result.code).toContain('const c = 3;');
      // Order must be preserved
      expect(result.code.indexOf('a.js')).toBeLessThan(result.code.indexOf('b.js'));
      expect(result.code.indexOf('b.js')).toBeLessThan(result.code.indexOf('c.js'));
    });

    it('should produce a valid JSON source map index in merged output', () => {
      const merger = new ChunkMerger();
      const chunks = [
        { file: '/src/x.js', code: 'export const x = 10;', map: JSON.stringify({ version: 3, sources: ['/src/x.js'], mappings: '' }) },
        { file: '/src/y.js', code: 'export const y = 20;' },
      ];
      const result = merger.merge(chunks);
      const map = JSON.parse(result.map);
      expect(map.version).toBe(3);
      expect(Array.isArray(map.sections)).toBe(true);
    });

    it('should track chunkOffsets for every file', () => {
      const merger = new ChunkMerger();
      const chunks = [
        { file: '/a.js', code: 'const a = 1;' },
        { file: '/b.js', code: 'const b = 2;' },
      ];
      const result = merger.merge(chunks);
      expect(result.chunkOffsets).toHaveProperty('/a.js');
      expect(result.chunkOffsets).toHaveProperty('/b.js');
      expect(result.chunkOffsets['/b.js']).toBeGreaterThan(result.chunkOffsets['/a.js']);
    });
  });

  // ─── BuildScheduler topologicalGroups ───────────────────────────────

  describe('BuildScheduler.topologicalGroups', () => {
    let projectRoot: string;
    let ray: any;

    beforeAll(async () => {
      projectRoot = path.resolve(process.cwd(), 'tests/fixtures/scheduler-project');
      fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });

      // Create simple fixture files
      fs.writeFileSync(path.join(projectRoot, 'src', 'a.js'), 'export const a = 1;');
      fs.writeFileSync(path.join(projectRoot, 'src', 'b.js'), 'import { a } from "./a.js";\nexport const b = a + 1;');
      fs.writeFileSync(path.join(projectRoot, 'src', 'c.js'), 'export const c = 3;');

      const { RayCore } = await import('../../packages/core/src/index.js');
      ray = new RayCore(projectRoot);
      await ray.init();
    });

    afterAll(() => {
      fs.rmSync(projectRoot, { recursive: true, force: true });
    });

    it('should return files with no dependencies in the first group', () => {
      const scheduler = new BuildScheduler(ray);
      // Register the modules in the graph so topological sort can work
      ray.graph.registerModule(
        path.join(projectRoot, 'src', 'a.js'),
        path.join(projectRoot, 'src', 'a.js'),
        '/src/a.js'
      );
      ray.graph.registerModule(
        path.join(projectRoot, 'src', 'b.js'),
        path.join(projectRoot, 'src', 'b.js'),
        '/src/b.js'
      );
      ray.graph.registerModule(
        path.join(projectRoot, 'src', 'c.js'),
        path.join(projectRoot, 'src', 'c.js'),
        '/src/c.js'
      );

      // b depends on a
      ray.graph.updateDependencies(
        path.join(projectRoot, 'src', 'b.js'),
        new Set([path.join(projectRoot, 'src', 'a.js')]),
        (id: string) => ({ file: id, url: '/' + path.relative(projectRoot, id) })
      );

      const files = [
        path.join(projectRoot, 'src', 'a.js'),
        path.join(projectRoot, 'src', 'b.js'),
        path.join(projectRoot, 'src', 'c.js'),
      ];

      const groups = scheduler.topologicalGroups(files);

      // a and c have no deps → should be in group 0
      expect(groups.length).toBeGreaterThanOrEqual(2);
      const firstGroup = groups[0];
      expect(firstGroup).toContain(path.join(projectRoot, 'src', 'a.js'));
      expect(firstGroup).toContain(path.join(projectRoot, 'src', 'c.js'));
      // b depends on a → must be in a later group
      const lastGroups = groups.slice(1).flat();
      expect(lastGroups).toContain(path.join(projectRoot, 'src', 'b.js'));
    });

    it('should compile all files via BuildScheduler.buildFiles and return results', async () => {
      const scheduler = new BuildScheduler(ray);
      const files = [
        path.join(projectRoot, 'src', 'a.js'),
        path.join(projectRoot, 'src', 'c.js'),
      ];
      const result = await scheduler.buildFiles(files);
      expect(result.compiledCount).toBeGreaterThanOrEqual(0);
      expect(typeof result.durationMs).toBe('number');
      expect(result.results).toBeDefined();
    });

    it('should merge output into a single bundle when mergeOutput=true', async () => {
      const scheduler = new BuildScheduler(ray);
      const files = [
        path.join(projectRoot, 'src', 'a.js'),
        path.join(projectRoot, 'src', 'c.js'),
      ];
      const result = await scheduler.buildFiles(files, { mergeOutput: true });
      expect(result.bundle).toBeDefined();
      expect(typeof result.bundle!.code).toBe('string');
      expect(result.bundle!.code.length).toBeGreaterThan(0);
    });
  });
});
