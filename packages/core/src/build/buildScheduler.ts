import { Worker } from 'worker_threads';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { RayCore } from '../index.js';
import { ChunkMerger, CompiledChunk } from './chunkMerger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface BatchBuildResult {
  durationMs: number;
  compiledCount: number;
  /** Merged bundle when mergeOutput=true */
  bundle?: { code: string; map: string };
  /** Per-file results */
  results: Record<string, { code: string; map?: string }>;
}

/**
 * BuildScheduler
 *
 * Orchestrates parallel module compilation using:
 *  1. Kahn's topological sort on the DependencyGraph to identify fully
 *     independent module groups (levels).
 *  2. Worker-pool dispatch: each level's modules are compiled simultaneously
 *     across worker threads.
 *  3. ChunkMerger: deterministic merge of parallel results into a single bundle.
 *
 * Satisfies: Parallel · Incremental · Deterministic · Observable · Cacheable
 */
export class BuildScheduler {
  private ray: RayCore;
  private workerCount: number;
  private workerPath: string;

  constructor(ray: RayCore, workerCount = 4) {
    this.ray = ray;
    this.workerCount = workerCount;

    // Resolve the compiled worker script from dist/
    let wp = path.join(__dirname, 'compilerWorker.js');
    if (!fs.existsSync(wp)) {
      wp = path.join(__dirname, '../../dist/build/compilerWorker.js');
    }
    this.workerPath = wp;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Topological Sort (Kahn's Algorithm)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Returns an ordered list of independent compilation groups.
   * Modules in the same group have no dependency relationship between them
   * and can be compiled simultaneously.
   *
   * @param files - The set of files to schedule (must be registered in DependencyGraph)
   */
  topologicalGroups(files: string[]): string[][] {
    const fileSet = new Set(files);

    // Build a local in-degree map restricted to the given file set
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>(); // file → files that depend on it

    for (const file of files) {
      if (!inDegree.has(file)) inDegree.set(file, 0);
      if (!adjacency.has(file)) adjacency.set(file, []);

      const deps = this.ray.graph.getDependencies(file);
      for (const dep of deps) {
        if (!fileSet.has(dep)) continue; // ignore out-of-set edges
        inDegree.set(file, (inDegree.get(file) ?? 0) + 1);
        if (!adjacency.has(dep)) adjacency.set(dep, []);
        adjacency.get(dep)!.push(file);
      }
    }

    const groups: string[][] = [];
    let frontier = files.filter((f) => (inDegree.get(f) ?? 0) === 0);

    while (frontier.length > 0) {
      groups.push([...frontier]);
      const next: string[] = [];
      for (const f of frontier) {
        for (const dependent of adjacency.get(f) ?? []) {
          const newDeg = (inDegree.get(dependent) ?? 1) - 1;
          inDegree.set(dependent, newDeg);
          if (newDeg === 0) next.push(dependent);
        }
      }
      frontier = next;
    }

    // Any files with remaining in-degree are part of a cycle — schedule last
    const remaining = files.filter((f) => (inDegree.get(f) ?? 0) > 0);
    if (remaining.length > 0) {
      groups.push(remaining);
    }

    return groups;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Worker Pool Dispatch
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Compiles a single file via a dedicated worker thread.
   * Falls back to in-process RayCore.transform() when the worker script is missing.
   */
  private compileFile(
    file: string,
    code: string,
    options: { minify?: boolean; define?: Record<string, string> } = {}
  ): Promise<{ code: string; map?: string }> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.workerPath)) {
        // In-process fallback (e.g. dev mode before first build)
        this.ray.transform(code, file)
          .then((c) => resolve({ code: c }))
          .catch(reject);
        return;
      }

      const worker = new Worker(this.workerPath);
      worker.postMessage({ code, file, options });

      worker.once('message', (msg: { success: boolean; code?: string; map?: string; error?: string }) => {
        worker.terminate();
        if (msg.success) {
          resolve({ code: msg.code!, map: msg.map });
        } else {
          // Worker error → graceful in-process fallback
          this.ray.transform(code, file)
            .then((c) => resolve({ code: c }))
            .catch(reject);
        }
      });

      worker.once('error', () => {
        worker.terminate();
        this.ray.transform(code, file)
          .then((c) => resolve({ code: c }))
          .catch(reject);
      });
    });
  }

  /**
   * Dispatches an entire group of files to the worker pool simultaneously
   * and returns ordered { file, code, map } results.
   */
  private async runGroup(
    group: string[],
    options: { minify?: boolean; define?: Record<string, string> } = {}
  ): Promise<CompiledChunk[]> {
    const results = await Promise.all(
      group.map(async (file) => {
        let code = '';
        try {
          code = fs.readFileSync(file, 'utf-8');
        } catch {
          return null;
        }

        const node = this.ray.graph.getModule(file);
        if (node && node.status === 'clean' && node.cachedOutput?.code) {
          return { file, code: node.cachedOutput.code, map: node.cachedOutput.map };
        }

        const result = await this.compileFile(file, code, options);
        return { file, code: result.code, map: result.map };
      })
    );

    return results.filter(Boolean) as CompiledChunk[];
  }

  // ─────────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Main entry point: schedules files by topological level, compiles each
   * level in parallel, and optionally merges the output into a single bundle.
   */
  async buildFiles(
    files: string[],
    options: { minify?: boolean; define?: Record<string, string>; mergeOutput?: boolean } = {}
  ): Promise<BatchBuildResult> {
    const start = performance.now();
    const uniqueFiles = Array.from(new Set(files));
    console.log(`[Ray Scheduler] Scheduling build batch for ${uniqueFiles.length} files...`);

    const groups = this.topologicalGroups(uniqueFiles);
    const allChunks: CompiledChunk[] = [];
    const perFile: Record<string, { code: string; map?: string }> = {};

    for (const group of groups) {
      const chunks = await this.runGroup(group, options);
      for (const chunk of chunks) {
        allChunks.push(chunk);
        perFile[chunk.file] = { code: chunk.code, map: chunk.map };
      }
    }

    const compiledCount = allChunks.length;
    const durationMs = Number((performance.now() - start).toFixed(2));
    console.log(`[Ray Scheduler] Batch compilation finished. Compiled ${compiledCount} files in ${durationMs}ms.`);

    const result: BatchBuildResult = { durationMs, compiledCount, results: perFile };

    if (options.mergeOutput && allChunks.length > 0) {
      const merger = new ChunkMerger();
      result.bundle = merger.merge(allChunks);
    }

    return result;
  }
}
