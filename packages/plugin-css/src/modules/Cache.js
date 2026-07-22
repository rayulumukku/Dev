export class CSSModulesCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, css, mapping) {
    this.cache.set(key, { css, mapping });
  }

  clear() {
    this.cache.clear();
  }
}

export const globalCSSModulesCache = new CSSModulesCache();
