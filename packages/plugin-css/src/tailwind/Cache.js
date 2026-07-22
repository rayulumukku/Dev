export class TailwindCache {
  constructor() {
    this.generatedCSSCache = new Map();
  }

  get(key) {
    return this.generatedCSSCache.get(key);
  }

  set(key, css, hash) {
    this.generatedCSSCache.set(key, { css, hash });
  }

  clear() {
    this.generatedCSSCache.clear();
  }
}

export const globalTailwindCache = new TailwindCache();
