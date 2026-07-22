export class TailwindCache {
  private generatedCSSCache = new Map<string, { css: string; hash: string }>();

  get(key: string) {
    return this.generatedCSSCache.get(key);
  }

  set(key: string, css: string, hash: string) {
    this.generatedCSSCache.set(key, { css, hash });
  }

  clear() {
    this.generatedCSSCache.clear();
  }
}

export const globalTailwindCache = new TailwindCache();
