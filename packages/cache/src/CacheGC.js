import fs from 'fs';
import path from 'path';

export function runGarbageCollection(cacheDir, maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  if (!fs.existsSync(cacheDir)) return 0;

  let removedCount = 0;
  const now = Date.now();
  const files = fs.readdirSync(cacheDir);

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const fullPath = path.join(cacheDir, file);
    try {
      const stats = fs.statSync(fullPath);
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(fullPath);
        removedCount++;
      }
    } catch {
      // ignore
    }
  }

  return removedCount;
}
