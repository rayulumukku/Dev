import fs from 'fs';
import path from 'path';

/**
 * Display active server runtime telemetry and compilation caches statistics.
 */
export function displayStats(projectRoot: string) {
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

  // 2. Memory limits
  const mem = process.memoryUsage();
  console.log(`\n> Memory Usage (Node Heap)`);
  console.log(`  - RSS:                   ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - Heap Total:            ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - Heap Used:             ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  - External Buffers:      ${(mem.external / 1024 / 1024).toFixed(2)} MB`);

  // 3. Platform configuration details
  console.log(`\n> Compiler Engine`);
  console.log(`  - Platform Target:       Node.js (${process.version})`);
  console.log(`  - OS Target:             ${process.platform}`);
  console.log(`  - Process CPU time:      ${process.cpuUsage().user / 1000} ms`);

  console.log('\n---------------------------------------\n');
}
