export class CSSModulesCache {
  private cache = new Map<string, { css: string; mapping: Record<string, string> }>();

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, css: string, mapping: Record<string, string>) {
    this.cache.set(key, { css, mapping });
  }

  clear() {
    this.cache.clear();
  }
}

export const globalCSSModulesCache = new CSSModulesCache();
