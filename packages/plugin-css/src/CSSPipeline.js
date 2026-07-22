import { globalCSSModuleGraph } from './CSSModuleGraph.js';

export function processCSS(code, filename) {
  const importRegex = /@import\s+["']([^"']+)["'];?/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
    globalCSSModuleGraph.addDependency(filename, match[1]);
  }

  const jsCode = `
if (typeof document !== 'undefined') {
  const existing = document.querySelector(\`style[data-ray-css="\${${JSON.stringify(filename)}}"]\`);
  if (existing) {
    existing.innerHTML = ${JSON.stringify(code)};
  } else {
    const style = document.createElement('style');
    style.setAttribute('data-ray-css', ${JSON.stringify(filename)});
    style.innerHTML = ${JSON.stringify(code)};
    document.head.appendChild(style);
  }
}
export default ${JSON.stringify(code)};
`;

  return {
    code,
    jsCode,
    imports,
  };
}
