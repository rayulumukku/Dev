import { describe, it, expect, vi } from 'vitest';
import { BundleCollector } from '../../packages/plugin-analyzer/src/BundleCollector.js';
import { ModuleAnalyzer } from '../../packages/plugin-analyzer/src/ModuleAnalyzer.js';
import { ChunkAnalyzer } from '../../packages/plugin-analyzer/src/ChunkAnalyzer.js';
import { TreeShakeAnalyzer } from '../../packages/plugin-analyzer/src/TreeShakeAnalyzer.js';
import { DuplicateDetector } from '../../packages/plugin-analyzer/src/DuplicateDetector.js';
import { ReportGenerator } from '../../packages/plugin-analyzer/src/ReportGenerator.js';
import { generateHtmlReport } from '../../packages/plugin-analyzer/src/ui/template.js';
import { analyzer } from '../../packages/plugin-analyzer/src/AnalyzerPlugin.js';
import fs from 'fs';
import path from 'path';

describe('Official @ray/plugin-analyzer Package (PR-31)', () => {
  it('1. should collect modules, chunks, and assets during build lifecycle', () => {
    const collector = new BundleCollector();

    collector.recordModule('src/App.tsx', 'export function App() { return <div>App</div>; }', 'function App(){}');
    collector.recordChunk('main.js', 'console.log("bundle");', { isEntry: true });
    collector.recordAsset('logo.png', Buffer.from('fake-image-data'));

    expect(collector.getModules().size).toBe(1);
    expect(collector.getChunks().size).toBe(1);
    expect(collector.getAssets().size).toBe(1);
  });

  it('2. should analyze modules and identify node_modules packages', () => {
    const collector = new BundleCollector();
    collector.recordModule('node_modules/lodash/index.js', 'module.exports = {};', 'exports.a=1');
    collector.recordModule('src/index.ts', 'const x = 1;', 'const x=1;');

    const analyzerInst = new ModuleAnalyzer();
    const modules = analyzerInst.analyzeModules(collector.getModules());

    expect(modules.length).toBe(2);
    const lodashMod = modules.find(m => m.id.includes('lodash'));
    expect(lodashMod?.isNodeModule).toBe(true);
    expect(lodashMod?.packageName).toBe('lodash');
  });

  it('3. should analyze chunks and assets with compression estimates', () => {
    const collector = new BundleCollector();
    collector.recordChunk('index.js', 'console.log("hello world");', { isEntry: true });
    collector.recordAsset('style.css', 'body { color: red; }');

    const analyzerInst = new ModuleAnalyzer();
    const modules = analyzerInst.analyzeModules(collector.getModules());

    const chunkAnalyzer = new ChunkAnalyzer();
    const chunks = chunkAnalyzer.analyzeChunks(collector.getChunks(), modules);
    const assets = chunkAnalyzer.analyzeAssets(collector.getAssets());

    expect(chunks.length).toBe(1);
    expect(chunks[0].size).toBeGreaterThan(0);
    expect(chunks[0].gzipSize).toBeGreaterThan(0);
    expect(assets.length).toBe(1);
    expect(assets[0].type).toBe('stylesheet');
  });

  it('4. should calculate tree-shaking metrics and dead code estimates', () => {
    const modules = [
      {
        id: 'src/util.ts',
        name: 'util.ts',
        path: 'src/util.ts',
        size: 1000,
        transformedSize: 400,
        gzipSize: 140,
        brotliSize: 120,
        isNodeModule: false,
        chunks: ['main.js'],
        isTreeShaken: true,
        deadBytesEstimate: 600,
      },
    ];

    const treeShakeAnalyzer = new TreeShakeAnalyzer();
    const metrics = treeShakeAnalyzer.calculateTreeShakingMetrics(modules);

    expect(metrics.deadCodeEstimate).toBe(600);
    expect(metrics.treeShakenPercentage).toBe(60);
  });

  it('5. should detect duplicate packages across dependencies', () => {
    const modules = [
      {
        id: 'node_modules/lodash/a.js',
        name: 'a.js',
        path: 'a.js',
        size: 100,
        transformedSize: 100,
        gzipSize: 35,
        brotliSize: 30,
        isNodeModule: true,
        packageName: 'lodash',
        packageVersion: '4.17.21',
        chunks: ['main.js'],
        isTreeShaken: false,
        deadBytesEstimate: 0,
      },
      {
        id: 'node_modules/lodash/b.js',
        name: 'b.js',
        path: 'b.js',
        size: 100,
        transformedSize: 100,
        gzipSize: 35,
        brotliSize: 30,
        isNodeModule: true,
        packageName: 'lodash',
        packageVersion: '4.17.20',
        chunks: ['vendor.js'],
        isTreeShaken: false,
        deadBytesEstimate: 0,
      },
    ];

    const duplicateDetector = new DuplicateDetector();
    const dups = duplicateDetector.detectDuplicates(modules);

    expect(dups.length).toBe(1);
    expect(dups[0].name).toBe('lodash');
    expect(dups[0].versions).toContain('4.17.21');
    expect(dups[0].versions).toContain('4.17.20');
  });

  it('6. should run recommendation engine for performance insights', () => {
    const reportGen = new ReportGenerator();
    const recs = reportGen.generateRecommendations(
      [],
      [],
      [{ name: 'huge-hero.png', size: 500 * 1024, gzipSize: 200 * 1024, type: 'image', extension: 'png' }],
      [{ name: 'lodash', versions: ['4.17.20', '4.17.21'], count: 2, totalSize: 50000 }]
    );

    expect(recs.length).toBeGreaterThanOrEqual(2);
    expect(recs.some(r => r.category === 'duplicates')).toBe(true);
    expect(recs.some(r => r.category === 'assets')).toBe(true);
  });

  it('7. should render self-contained HTML report template', () => {
    const reportGen = new ReportGenerator();
    const result = reportGen.generateReport([], [], [], [], { deadCodeEstimate: 0, treeShakenPercentage: 0 });

    const html = generateHtmlReport(result);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Ray Bundle Analyzer Report');
    expect(html).toContain('Total Bundle Size');
  });

  it('8. should write JSON and HTML report files to disk', () => {
    const tempDir = path.join(process.cwd(), 'temp-analyzer-test');
    const reportGen = new ReportGenerator();
    const result = reportGen.generateReport([], [], [], [], { deadCodeEstimate: 0, treeShakenPercentage: 0 });

    const { htmlPath, jsonPath } = reportGen.writeReportFiles(result, tempDir, { html: true, json: true });

    expect(fs.existsSync(htmlPath)).toBe(true);
    expect(fs.existsSync(jsonPath)).toBe(true);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('9. should execute plugin hooks cleanly during bundle close', async () => {
    const tempDir = path.join(process.cwd(), 'temp-plugin-analyzer-test');
    const plugin = analyzer({ outDir: tempDir, open: false });

    plugin.buildStart();
    await plugin.transform('const a = 10;', 'src/index.ts');
    await plugin.generateBundle({}, {
      'index.js': { type: 'chunk', code: 'const a=10;', isEntry: true },
    });

    const ctx = { projectRoot: process.cwd() };
    await plugin.closeBundle.call(ctx);

    expect(fs.existsSync(path.join(tempDir, 'bundle-analyzer.html'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, 'bundle-analyzer.json'))).toBe(true);

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
