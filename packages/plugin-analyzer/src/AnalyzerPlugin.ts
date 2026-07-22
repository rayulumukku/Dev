import { AnalyzerPluginOptions } from './types.js';
import { BundleCollector } from './BundleCollector.js';
import { ModuleAnalyzer } from './ModuleAnalyzer.js';
import { ChunkAnalyzer } from './ChunkAnalyzer.js';
import { TreeShakeAnalyzer } from './TreeShakeAnalyzer.js';
import { DuplicateDetector } from './DuplicateDetector.js';
import { ReportGenerator } from './ReportGenerator.js';
import { exec } from 'child_process';
import path from 'path';

export function analyzer(options: AnalyzerPluginOptions = {}): any {
  const collector = new BundleCollector();
  const moduleAnalyzer = new ModuleAnalyzer();
  const chunkAnalyzer = new ChunkAnalyzer();
  const treeShakeAnalyzer = new TreeShakeAnalyzer();
  const duplicateDetector = new DuplicateDetector();
  const reportGenerator = new ReportGenerator();

  const enabled = options.enabled !== false;

  return {
    name: '@ray/plugin-analyzer',
    enforce: 'post',

    buildStart() {
      if (enabled) {
        collector.clear();
      }
    },

    async transform(code: string, id: string) {
      if (!enabled) return null;
      collector.recordModule(id, code);
      return null;
    },

    async generateBundle(this: any, optionsOutput: any, bundle: any) {
      if (!enabled || !bundle) return;

      for (const [fileName, item] of Object.entries(bundle)) {
        if ((item as any).type === 'chunk' || (item as any).code) {
          collector.recordChunk(fileName, (item as any).code || '', {
            isEntry: !!(item as any).isEntry,
            imports: (item as any).imports || [],
            dynamicImports: (item as any).dynamicImports || [],
          });
        } else if ((item as any).type === 'asset' || (item as any).source) {
          collector.recordAsset(fileName, (item as any).source || '');
        }
      }
    },

    async closeBundle(this: any) {
      if (!enabled) return;

      const projectRoot = this?.projectRoot || process.cwd();
      const outDir = path.resolve(projectRoot, options.outDir || 'dist/analyzer');

      const rawModules = collector.getModules();
      const rawChunks = collector.getChunks();
      const rawAssets = collector.getAssets();

      // If no chunks captured via generateBundle, build synthetic entry chunk for reporting
      if (rawChunks.size === 0) {
        collector.recordChunk('bundle.js', '// Compiled bundle output', { isEntry: true });
      }

      const modules = moduleAnalyzer.analyzeModules(rawModules);
      const chunks = chunkAnalyzer.analyzeChunks(collector.getChunks(), modules);
      const assets = chunkAnalyzer.analyzeAssets(rawAssets);
      const duplicates = duplicateDetector.detectDuplicates(modules);
      const treeShaking = treeShakeAnalyzer.calculateTreeShakingMetrics(modules);

      const result = reportGenerator.generateReport(
        modules,
        chunks,
        assets,
        duplicates,
        treeShaking
      );

      const { htmlPath, jsonPath } = reportGenerator.writeReportFiles(result, outDir, {
        html: options.html !== false,
        json: options.json !== false,
        reportFilename: options.reportFilename,
        jsonFilename: options.jsonFilename,
      });

      console.log(`\n⚡ [Ray Analyzer] Analysis complete!`);
      console.log(`  > HTML Report: ${htmlPath}`);
      console.log(`  > JSON Report: ${jsonPath}`);
      console.log(`  > Total Size:  ${(result.bundleSize / 1024).toFixed(1)} KB (Est. Gzip: ${(result.gzipSize / 1024).toFixed(1)} KB)`);

      if (options.open) {
        try {
          if (process.platform === 'win32') {
            exec(`start "" "${htmlPath}"`);
          } else if (process.platform === 'darwin') {
            exec(`open "${htmlPath}"`);
          } else {
            exec(`xdg-open "${htmlPath}"`);
          }
        } catch { /* proceed */ }
      }
    },
  };
}

export const analyzerPlugin = analyzer;
