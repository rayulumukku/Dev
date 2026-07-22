import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export function scanDirectoryJS(dir) {
  const results = [];

  function traverse(curr) {
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

export function hashContentJS(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function serializeMetadataJS(data) {
  return JSON.stringify(data);
}

export function computeCacheKeyJS(input) {
  return crypto.createHash('sha256').update(input.filePath + input.code + (input.version || '1.0.0')).digest('hex');
}
