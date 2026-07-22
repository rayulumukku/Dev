import { AnalysisResult, Recommendation, ModuleMeta, ChunkMeta, AssetMeta, DuplicatedPackage } from './types.js';
import { generateHtmlReport } from './ui/template.js';
import fs from 'fs';
import path from 'path';

export class ReportGenerator {
  generateReport(
    modules: ModuleMeta[],
    chunks: ChunkMeta[],
    assets: AssetMeta[],
    duplicates: DuplicatedPackage[],
    treeShaking: { deadCodeEstimate: number; treeShakenPercentage: number }
  ): AnalysisResult {
    let bundleSize = 0;
    let gzipSize = 0;
    let brotliSize = 0;

    for (const c of chunks) {
      bundleSize += c.size;
      gzipSize += c.gzipSize;
      brotliSize += c.brotliSize;
    }

    const largestModules = [...modules].sort((a, b) => b.transformedSize - a.transformedSize).slice(0, 10);
    const recommendations = this.generateRecommendations(modules, chunks, assets, duplicates);

    return {
      timestamp: Date.now(),
      bundleSize,
      gzipSize,
      brotliSize,
      chunkCount: chunks.length,
      moduleCount: modules.length,
      deadCodeEstimate: treeShaking.deadCodeEstimate,
      treeShakenPercentage: treeShaking.treeShakenPercentage,
      chunks,
      modules,
      assets,
      duplicatedPackages: duplicates,
      largestModules,
      recommendations,
    };
  }

  generateRecommendations(
    modules: ModuleMeta[],
    chunks: ChunkMeta[],
    assets: AssetMeta[],
    duplicates: DuplicatedPackage[]
  ): Recommendation[] {
    const recs: Recommendation[] = [];

    // Rule 1: Duplicate Dependencies
    if (duplicates.length > 0) {
      for (const d of duplicates) {
        recs.push({
          id: `dup-${d.name}`,
          title: `Duplicate Package: ${d.name}`,
          category: 'duplicates',
          severity: 'high',
          message: `Package "${d.name}" is bundled ${d.count} times across ${d.versions.length} versions.`,
          explanation: 'Duplicate package versions bloat bundle size and can lead to unexpected runtime state bugs.',
          action: `Deduplicate ${d.name} using package manager resolutions or Ray alias override.`,
        });
      }
    }

    // Rule 2: Oversized Assets
    for (const a of assets) {
      if (a.size > 250 * 1024) {
        recs.push({
          id: `asset-${a.name}`,
          title: `Oversized Asset: ${a.name}`,
          category: 'assets',
          severity: 'medium',
          message: `Asset "${a.name}" is ${(a.size / 1024).toFixed(1)} KB.`,
          explanation: 'Large uncompressed assets delay initial page loading and inflate total bandwidth.',
          action: 'Compress image asset or convert format to WebP / AVIF.',
        });
      }
    }

    // Rule 3: Large node_modules Packages
    const largePkgs = modules.filter(m => m.isNodeModule && m.transformedSize > 150 * 1024);
    for (const p of largePkgs) {
      recs.push({
        id: `pkg-${p.name}`,
        title: `Large Dependency: ${p.packageName || p.name}`,
        category: 'packages',
        severity: 'medium',
        message: `Module "${p.name}" contributes ${(p.transformedSize / 1024).toFixed(1)} KB to production bundle.`,
        explanation: 'Heavy third-party libraries significantly increase JavaScript execution & parsing time.',
        action: 'Consider lightweight alternatives or lazy-loading this module with dynamic import().',
      });
    }

    // Rule 4: Excessive Chunk Splitting
    if (chunks.length > 15) {
      recs.push({
        id: 'chunk-excessive',
        title: 'Excessive Chunk Splitting',
        category: 'splitting',
        severity: 'low',
        message: `Bundle created ${chunks.length} small chunks.`,
        explanation: 'Creating too many small chunks increases HTTP request overhead.',
        action: 'Tune minChunkSize in ray.config.ts to merge tiny chunks.',
      });
    }

    return recs;
  }

  writeReportFiles(
    result: AnalysisResult,
    outDir: string,
    options: { html?: boolean; json?: boolean; reportFilename?: string; jsonFilename?: string } = {}
  ) {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const htmlPath = path.join(outDir, options.reportFilename || 'bundle-analyzer.html');
    const jsonPath = path.join(outDir, options.jsonFilename || 'bundle-analyzer.json');

    if (options.html !== false) {
      const htmlContent = generateHtmlReport(result);
      fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    }

    if (options.json !== false) {
      fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
    }

    return { htmlPath, jsonPath };
  }
}
