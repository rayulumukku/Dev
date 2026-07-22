import fs from 'fs';
import path from 'path';

/**
 * Display active server runtime telemetry and compilation caches statistics.
 */
export async function displayStats(projectRoot: string) {
  console.log('\n⚡ Ray Dev Performance Statistics ⚡\n');

  // 1. Caches hit metrics
  const cacheDir = path.join(projectRoot, '.ray/cache');
  const metadataPath = path.join(cacheDir, 'metadata.json');
  let cacheHitRatio = '0%';
  let cacheItemsCount = 0;

  if (fs.existsSync(metadataPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      if (meta.optimized) {
        cacheItemsCount = Object.keys(meta.optimized).length;
        cacheHitRatio = cacheItemsCount > 0 ? '100% (Warm Start)' : '0%';
      }
    } catch {}
  }

  console.log(`> Dependency Optimizer`);
  console.log(`  - Cached Bundles count:  ${cacheItemsCount}`);
  console.log(`  - Cache Hit Ratio:       ${cacheHitRatio}`);

  // 2. Incremental Build Metrics
  try {
    const { IncrementalBuildEngine } = await import('@ray/incremental-build');
    const incMetrics = IncrementalBuildEngine.getLastMetrics();

    console.log(`\n> Incremental Production Build Engine`);
    console.log(`  - Reused Artifacts:      ${incMetrics.reusedArtifacts}`);
    console.log(`  - Rebuilt Artifacts:     ${incMetrics.rebuiltArtifacts}`);
    console.log(`  - Incremental Hit Ratio: ${incMetrics.cacheHitRatio}%`);
    console.log(`  - Build Time Savings:    ${incMetrics.timeSavedMs} ms`);
    if (Object.keys(incMetrics.invalidationReasons).length > 0) {
      console.log(`  - Invalidation Reasons:  ${JSON.stringify(incMetrics.invalidationReasons)}`);
    }
  } catch {
    // Incremental engine not loaded
  }

  // 3. Memory limits
  const mem = process.memoryUsage();
  console.log(`\n> Memory Usage (Node Heap)`);
  console.log(`  - RSS:                   ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - Heap Total:            ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - Heap Used:             ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - External Buffers:      ${(mem.external / 1024 / 1024).toFixed(2)} MB`);

  // 4. Platform configuration details
  console.log(`\n> Compiler Engine`);
  console.log(`  - Platform Target:       Node.js (${process.version})`);
  console.log(`  - OS Target:             ${process.platform}`);
  console.log(`  - Process CPU time:      ${process.cpuUsage().user / 1000} ms`);

  console.log('\n---------------------------------------\n');
}
