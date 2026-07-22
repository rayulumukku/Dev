import { compileCSSModule } from './ModuleCompiler.js';
import { globalCSSModulesCache } from './Cache.js';

export function processCSSModule(
  code: string,
  filename: string,
  isProduction: boolean = false
): { css: string; jsCode: string; mapping: Record<string, string> } {
  const compiled = compileCSSModule(code, filename, isProduction);
  globalCSSModulesCache.set(filename, compiled.css, compiled.mapping);
  return compiled;
}
