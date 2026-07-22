export class PostCSSCache {
  private configCache = new Map<string, { config: any; timestamp: number }>();
  private resultCache = new Map<string, { css: string; map?: any; hash: string }>();

  getConfig(key: string) {
    return this.configCache.get(key);
  }

  setConfig(key: string, config: any) {
    this.configCache.set(key, { config, timestamp: Date.now() });
  }

  getResult(key: string) {
    return this.resultCache.get(key);
  }

  setResult(key: string, result: { css: string; map?: any; hash: string }) {
    this.resultCache.set(key, result);
  }

  clear() {
    this.configCache.clear();
    this.resultCache.clear();
  }
}

export const globalPostCSSCache = new PostCSSCache();
