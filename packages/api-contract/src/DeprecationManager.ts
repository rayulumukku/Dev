import { APISymbol } from './types.js';

export class DeprecationManager {
  private static deprecatedSymbols = new Map<string, { symbol: APISymbol; replacement?: string; targetVersion?: string }>();

  static deprecate(symbol: APISymbol, replacement?: string, targetVersion = '2.0.0'): void {
    symbol.stability = 'deprecated';
    symbol.replacement = replacement;
    this.deprecatedSymbols.set(symbol.name, { symbol, replacement, targetVersion });
  }

  static getDeprecated(): Array<{ symbol: APISymbol; replacement?: string; targetVersion?: string }> {
    return Array.from(this.deprecatedSymbols.values());
  }

  static clear(): void {
    this.deprecatedSymbols.clear();
  }
}
