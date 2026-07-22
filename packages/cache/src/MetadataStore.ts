import { CacheStats } from './types.js';

export class MetadataStore {
  private hits = 0;
  private misses = 0;

  recordHit(): void {
    this.hits++;
  }

  recordMiss(): void {
    this.misses++;
  }

  getStats(totalEntries: number, cacheSizeBytes: number, oldestEntryTimestamp?: number): CacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? Math.round((this.hits / totalRequests) * 100) / 100 : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      totalEntries,
      cacheSizeBytes,
      oldestEntryTimestamp,
      hitRate,
    };
  }

  reset(): void {
    this.hits = 0;
    this.misses = 0;
  }
}
