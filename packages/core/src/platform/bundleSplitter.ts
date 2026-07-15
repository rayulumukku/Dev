/**
 * AutoBundleSplitter
 *
 * Analyses the DependencyGraph to identify automatic code split points:
 * large shared modules imported by ≥ 2 independent entry points should be
 * extracted into a separate async chunk.
 *
 * Satisfies: Incremental · Cacheable · Deterministic · Observable · Zero Global State
 */

export interface SplitPoint {
  /** The shared module file path */
  file: string;
  /** Number of different entry points that import this file (directly or transitively) */
  sharedByCount: number;
  /** Estimated byte size of the module (from source length) */
  estimatedBytes: number;
  /** Recommended action */
  recommendation: 'split' | 'keep';
}

export interface SplitAnalysis {
  splitPoints: SplitPoint[];
  totalModules: number;
  recommendedSplitCount: number;
  estimatedSavingsBytes: number;
}

export class AutoBundleSplitter {
  /**
   * Minimum number of bytes a module must exceed to be considered for splitting.
   */
  private sizeThresholdBytes: number;
  /**
   * Minimum number of independent importers required to qualify as a split point.
   */
  private importerThreshold: number;

  constructor(options: { sizeThresholdBytes?: number; importerThreshold?: number } = {}) {
    this.sizeThresholdBytes = options.sizeThresholdBytes ?? 5_000;
    this.importerThreshold = options.importerThreshold ?? 2;
  }

  /**
   * Analyse the dependency graph and return split point recommendations.
   *
   * @param graph - The Ray DependencyGraph instance
   * @param entryFiles - The known entry-point file paths
   */
  analyze(graph: any, entryFiles: string[]): SplitAnalysis {
    const entrySet = new Set(entryFiles);
    const modules = Array.from(graph.modules?.values?.() ?? []) as any[];

    // Build a reachability map: entryFile → Set<file>
    const reachability = new Map<string, Set<string>>();

    for (const entry of entryFiles) {
      const visited = new Set<string>();
      this.traverse(graph, entry, visited);
      reachability.set(entry, visited);
    }

    const splitPoints: SplitPoint[] = [];

    for (const mod of modules) {
      if (entrySet.has(mod.id)) continue; // skip entries themselves

      // Count how many entries can reach this module
      let sharedByCount = 0;
      for (const [, reachable] of reachability) {
        if (reachable.has(mod.id)) sharedByCount++;
      }

      const src = this.estimateSize(mod);
      const recommendation: 'split' | 'keep' =
        sharedByCount >= this.importerThreshold && src >= this.sizeThresholdBytes
          ? 'split'
          : 'keep';

      if (sharedByCount >= 1) {
        splitPoints.push({
          file: mod.id,
          sharedByCount,
          estimatedBytes: src,
          recommendation,
        });
      }
    }

    // Sort by savings potential
    splitPoints.sort((a, b) => b.estimatedBytes - a.estimatedBytes);

    const splits = splitPoints.filter((s) => s.recommendation === 'split');
    const estimatedSavingsBytes = splits.reduce((sum, s) => sum + s.estimatedBytes * (s.sharedByCount - 1), 0);

    return {
      splitPoints,
      totalModules: modules.length,
      recommendedSplitCount: splits.length,
      estimatedSavingsBytes,
    };
  }

  private traverse(graph: any, fileId: string, visited: Set<string>, depth = 0): void {
    if (visited.has(fileId) || depth > 100) return;
    visited.add(fileId);
    const deps: Set<string> = graph.getDependencies?.(fileId) ?? new Set();
    for (const dep of deps) this.traverse(graph, dep, visited, depth + 1);
  }

  private estimateSize(mod: any): number {
    if (mod.cachedOutput?.code) return Buffer.byteLength(mod.cachedOutput.code, 'utf-8');
    return 0;
  }

  /**
   * HTTP handler for /__ray/platform/split
   */
  httpHandler(graph: any, entryFiles: string[]): (req: any, res: any) => void {
    return (_req: any, res: any) => {
      const analysis = this.analyze(graph, entryFiles);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.statusCode = 200;
      res.end(JSON.stringify(analysis));
    };
  }
}

export default AutoBundleSplitter;
