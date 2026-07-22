export class CSSCache {
  constructor() {
    this.cache = new Map();
  }

  get(filename) {
    return this.cache.get(filename);
  }

  set(filename, info) {
    this.cache.set(filename, info);
  }

  invalidate(filename) {
    this.cache.delete(filename);
  }

  clear() {
    this.cache.clear();
  }
}

export const globalCSSCache = new CSSCache();
