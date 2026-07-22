import { compileCSSModule } from './ModuleCompiler.js';
import { globalCSSModulesCache } from './Cache.js';

export function processCSSModule(code, filename, isProduction = false) {
  const compiled = compileCSSModule(code, filename, isProduction);
  globalCSSModulesCache.set(filename, compiled.css, compiled.mapping);
  return compiled;
}
