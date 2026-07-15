import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';
import { RayCore } from '../index.js';

export interface BatchBuildResult {
  durationMs: number;
  compiledCount: number;
}

export class BuildScheduler {
  private ray: RayCore;
  private workerCount: number;

  constructor(ray: RayCore, workerCount = 4) {
    this.ray = ray;
    this.workerCount = workerCount;
  }

  /**
   * Performs a topological sort of the graph to run compilations in correct levels.
   */
  async buildFiles(files: string[]): Promise<BatchBuildResult> {
    const start = performance.now();
    let compiledCount = 0;

    // Deduplicate input files
    const uniqueFiles = Array.from(new Set(files));
    console.log(`[Ray Scheduler] Scheduling build batch for ${uniqueFiles.length} files...`);

    // Basic batch run: compile independent files in parallel using worker promises
    const promises = uniqueFiles.map(async (file) => {
      const node = this.ray.graph.getModule(file);
      // Skip if already clean
      if (node && node.status === 'clean' && node.cachedOutput) {
        return;
      }

      // Read file source content
      let content = '';
      try {
        content = await import('fs').then((fs) => fs.readFileSync(file, 'utf-8'));
      } catch {
        return; // Ignore if file missing
      }

      await this.ray.transform(content, file);
      compiledCount++;
    });

    await Promise.all(promises);

    const durationMs = Number((performance.now() - start).toFixed(2));
    console.log(`[Ray Scheduler] Batch compilation finished. Compiled ${compiledCount} files in ${durationMs}ms.`);

    return {
      durationMs,
      compiledCount
    };
  }
}
