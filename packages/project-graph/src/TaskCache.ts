export class TaskCache {
  private static cacheStore = new Set<string>();

  static isCached(taskId: string): boolean {
    return this.cacheStore.has(taskId);
  }

  static markCached(taskId: string): void {
    this.cacheStore.add(taskId);
  }

  static clear(): void {
    this.cacheStore.clear();
  }
}
