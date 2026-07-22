import { generateScopedClassName } from './ClassNameGenerator.js';
import { generateJSExports } from './ExportGenerator.js';

export function compileCSSModule(
  code: string,
  filename: string,
  isProduction: boolean = false
): { css: string; jsCode: string; mapping: Record<string, string> } {
  const mapping: Record<string, string> = {};
  const classSelectorRegex = /\.([a-zA-Z0-9_-]+)/g;

  const transformedCSS = code.replace(classSelectorRegex, (_match, className) => {
    if (!mapping[className]) {
      mapping[className] = generateScopedClassName(className, filename, isProduction);
    }
    return `.${mapping[className]}`;
  });

  const jsCode = generateJSExports(mapping, transformedCSS, filename);

  return {
    css: transformedCSS,
    jsCode,
    mapping,
  };
}
