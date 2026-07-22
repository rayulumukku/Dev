export class CacheView {
  static formatCache(hits: number, misses: number): Record<string, any> {
    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 1.0;
    return {
      hits,
      misses,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }
}
