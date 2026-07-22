import { resolveSassImport } from './ImportResolver.js';
import { globalSassDependencyTracker } from './DependencyTracker.js';

export function compileSass(code, filename) {
  const importRegex = /@(use|forward|import)\s+["']([^"']+)["'];?/g;
  const loadedUrls = [];

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const resolved = resolveSassImport(match[2], filename);
    if (resolved) {
      loadedUrls.push(resolved);
      globalSassDependencyTracker.addDependency(filename, resolved);
    }
  }

  let compiledCSS = code;

  const varMap = {};
  compiledCSS = compiledCSS.replace(/\$([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g, (_m, varName, varVal) => {
    varMap[varName] = varVal.trim();
    return '';
  });

  for (const [vName, vVal] of Object.entries(varMap)) {
    const regex = new RegExp(`\\$${vName}\\b`, 'g');
    compiledCSS = compiledCSS.replace(regex, vVal);
  }

  compiledCSS = compiledCSS.replace(/@(use|forward|import)\s+["']([^"']+)["'];?/g, '');

  return {
    css: compiledCSS.trim(),
    loadedUrls,
  };
}
