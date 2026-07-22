export function generateJSExports(mapping, cssCode, filename) {
  const jsonMapping = JSON.stringify(mapping);

  let namedExports = '';
  for (const [key, val] of Object.entries(mapping)) {
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
      namedExports += `export const ${key} = ${JSON.stringify(val)};\n`;
    }
  }

  return `
if (typeof document !== 'undefined') {
  const existing = document.querySelector(\`style[data-ray-css="\${${JSON.stringify(filename)}}"]\`);
  if (existing) {
    existing.innerHTML = ${JSON.stringify(cssCode)};
  } else {
    const style = document.createElement('style');
    style.setAttribute('data-ray-css', ${JSON.stringify(filename)});
    style.innerHTML = ${JSON.stringify(cssCode)};
    document.head.appendChild(style);
  }
}
const styles = ${jsonMapping};
${namedExports}
export default styles;
`;
}
