import fs from 'fs';
import path from 'path';
import { CacheEntry } from './types.js';
import { serializeEntry, deserializeEntry } from './Serialization.js';

export class CacheStore {
  private cacheDir: string;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
    fs.mkdirSync(this.cacheDir, { recursive: true });
  }

  get(hash: string): CacheEntry | null {
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

  set(entry: CacheEntry): void {
    const filePath = path.join(this.cacheDir, `${entry.hash}.json`);
    fs.writeFileSync(filePath, serializeEntry(entry));
  }

  delete(hash: string): void {
    const filePath = path.join(this.cacheDir, `${hash}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  clear(): void {
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true, force: true });
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getDirectory(): string {
    return this.cacheDir;
  }
}
