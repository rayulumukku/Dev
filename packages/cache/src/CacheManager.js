import fs from 'fs';
import path from 'path';
import { computeCacheKey } from './ContentHasher.js';
import { CacheStore } from './CacheStore.js';
import { MetadataStore } from './MetadataStore.js';
import { FileWatcherIndex } from './FileWatcher.js';
import { runGarbageCollection } from './CacheGC.js';

export class CacheManager {
  constructor(config = {}) {
    this.config = {
      dir: config.dir || path.join(process.cwd(), 'node_modules', '.cache', 'ray'),
      enabled: config.enabled ?? true,
      maxAgeDays: config.maxAgeDays || 7,
      maxSizeMB: config.maxSizeMB || 500,
    };
    this.store = new CacheStore(this.config.dir);
    this.metadata = new MetadataStore();
    this.watcherIndex = new FileWatcherIndex();
  }

  get(input) {
    if (!this.config.enabled || this.watcherIndex.isInvalid(input.filePath)) {
      this.metadata.recordMiss();
      return null;
    }

    const hash = computeCacheKey(input);
    const entry = this.store.get(hash);

    if (entry) {
      this.metadata.recordHit();
      return entry;
    } else {
      this.metadata.recordMiss();
      return null;
    }
  }

  set(input, transformedCode, map, metadata) {
    const hash = computeCacheKey(input);
    const entry = {
      hash,
      filePath: input.filePath,
      transformedCode,
      map,
      metadata,
      timestamp: Date.now(),
      accessCount: 1,
    };

    if (this.config.enabled) {
      this.store.set(entry);
    }
    return entry;
  }

  invalidate(filePath) {
    this.watcherIndex.markInvalid(filePath);
  }

  clean() {
    const dir = this.store.getDirectory();
    const removed = runGarbageCollection(dir, 0);
    this.metadata.reset();
    this.watcherIndex.clear();
    return removed;
  }

  gc() {
    const dir = this.store.getDirectory();
    const maxAgeMs = (this.config.maxAgeDays || 7) * 24 * 60 * 60 * 1000;
    return runGarbageCollection(dir, maxAgeMs);
  }

  getStats() {
    const dir = this.store.getDirectory();
    let totalEntries = 0;
    let cacheSizeBytes = 0;
    let oldestTimestamp;

    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const fullPath = path.join(dir, file);
        try {
          const stats = fs.statSync(fullPath);
          totalEntries++;
          cacheSizeBytes += stats.size;
          if (!oldestTimestamp || stats.mtimeMs < oldestTimestamp) {
            oldestTimestamp = stats.mtimeMs;
          }
        } catch {
          // ignore
        }
      }
    }

    return this.metadata.getStats(totalEntries, cacheSizeBytes, oldestTimestamp);
  }
}
