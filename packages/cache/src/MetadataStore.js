export class MetadataStore {
  constructor() {
    this.hits = 0;
    this.misses = 0;
  }

  recordHit() {
    this.hits++;
  }

  recordMiss() {
    this.misses++;
  }

  getStats(totalEntries, cacheSizeBytes, oldestEntryTimestamp) {
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

  reset() {
    this.hits = 0;
    this.misses = 0;
  }
}
