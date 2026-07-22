import fs from 'fs';
import path from 'path';
import { serializeEntry, deserializeEntry } from './Serialization.js';

export class CacheStore {
  constructor(cacheDir) {
    this.cacheDir = cacheDir;
    fs.mkdirSync(this.cacheDir, { recursive: true });
  }

  get(hash) {
    const filePath = path.join(this.cacheDir, `${hash}.json`);
    if (!fs.existsSync(filePath)) return null;

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const entry = deserializeEntry(raw);
      entry.accessCount = (entry.accessCount || 0) + 1;
      fs.writeFileSync(filePath, serializeEntry(entry));
      return entry;
    } catch {
      return null;
    }
  }

  set(entry) {
    const filePath = path.join(this.cacheDir, `${entry.hash}.json`);
    fs.writeFileSync(filePath, serializeEntry(entry));
  }

  delete(hash) {
    const filePath = path.join(this.cacheDir, `${hash}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  clear() {
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true, force: true });
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getDirectory() {
    return this.cacheDir;
  }
}
