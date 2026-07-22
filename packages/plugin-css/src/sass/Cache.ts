export class SassCache {
  private cache = new Map<string, { css: string; mtime: number }>();

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, css: string, mtime: number) {
    this.cache.set(key, { css, mtime });
  }

  clear() {
    this.cache.clear();
  }
}

export const globalSassCache = new SassCache();
