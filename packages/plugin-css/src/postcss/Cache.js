export class PostCSSCache {
  constructor() {
    this.configCache = new Map();
    this.resultCache = new Map();
  }

  getConfig(key) {
    return this.configCache.get(key);
  }

  setConfig(key, config) {
    this.configCache.set(key, { config, timestamp: Date.now() });
  }

  getResult(key) {
    return this.resultCache.get(key);
  }

  setResult(key, result) {
    this.resultCache.set(key, result);
  }

  clear() {
    this.configCache.clear();
    this.resultCache.clear();
  }
}

export const globalPostCSSCache = new PostCSSCache();
