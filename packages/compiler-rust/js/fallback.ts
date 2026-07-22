import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function scanDirectoryJS(dir: string): string[] {
  const results: string[] = [];

  function traverse(curr: string) {
    if (!fs.existsSync(curr)) return;
    const entries = fs.readdirSync(curr, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(curr, entry.name);
      if (entry.isDirectory()) {
        traverse(full);
      } else {
        results.push(full);
      }
    }
  }

  traverse(dir);
  return results;
}

export function hashContentJS(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function serializeMetadataJS(data: any): string {
  return JSON.stringify(data);
}

export function computeCacheKeyJS(input: { filePath: string; code: string; version?: string }): string {
  return crypto.createHash('sha256').update(input.filePath + input.code + (input.version || '1.0.0')).digest('hex');
}
