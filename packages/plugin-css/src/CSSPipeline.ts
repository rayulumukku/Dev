import { globalCSSModuleGraph } from './CSSModuleGraph.js';
import { processPostCSS } from './postcss/PostCSSPipeline.js';

export function processCSS(code: string, filename: string, rootDir?: string): { code: string; jsCode: string; imports: string[] } {
  // Execute PostCSS pipeline if config is present
  const { code: postProcessedCode } = processPostCSS(code, filename, rootDir);

  const importRegex = /@import\s+["']([^"']+)["'];?/g;
  const imports: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(postProcessedCode)) !== null) {
    imports.push(match[1]);
    globalCSSModuleGraph.addDependency(filename, match[1]);
  }

  const jsCode = `
if (typeof document !== 'undefined') {
  const existing = document.querySelector(\`style[data-ray-css="\${${JSON.stringify(filename)}}"]\`);
  if (existing) {
    existing.innerHTML = ${JSON.stringify(postProcessedCode)};
  } else {
    const style = document.createElement('style');
    style.setAttribute('data-ray-css', ${JSON.stringify(filename)});
    style.innerHTML = ${JSON.stringify(postProcessedCode)};
    document.head.appendChild(style);
  }
}
export default ${JSON.stringify(postProcessedCode)};
`;

  return {
    code: postProcessedCode,
    jsCode,
    imports,
  };
}
