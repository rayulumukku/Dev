import { CSSModuleInfo } from './types.js';

export class CSSCache {
  private cache = new Map<string, CSSModuleInfo>();

  get(filename: string): CSSModuleInfo | undefined {
    return this.cache.get(filename);
  }

  set(filename: string, info: CSSModuleInfo): void {
    this.cache.set(filename, info);
  }

  invalidate(filename: string): void {
    this.cache.delete(filename);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const globalCSSCache = new CSSCache();
