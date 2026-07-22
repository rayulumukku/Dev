import fs from 'fs';
import path from 'path';

export function calculateBundleSize(dir: string): number {
  if (!fs.existsSync(dir)) return 0;
  let totalBytes = 0;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      totalBytes += calculateBundleSize(fullPath);
    } else {
      totalBytes += fs.statSync(fullPath).size;
    }
  }

  return totalBytes;
}
