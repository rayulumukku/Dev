export class SassCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, css, mtime) {
    this.cache.set(key, { css, mtime });
  }

  clear() {
    this.cache.clear();
  }
}

export const globalSassCache = new SassCache();
