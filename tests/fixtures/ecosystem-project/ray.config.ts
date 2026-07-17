import { defineConfig, react, mdx, wasm, json, copy } from '@ray/core';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    mdx(),
    wasm(),
    json(),
    copy(),
    {
      name: 'custom:postcss-tailwind',
      async transform(code, id) {
        if (id.endsWith('.css') && !id.includes('.module.css') && !id.includes('node_modules')) {
          const result = await postcss([
            tailwindcss({
              content: [
                path.resolve(path.dirname(id), 'App.jsx'),
                path.resolve(path.dirname(id), 'main.jsx'),
              ],
            }),
            autoprefixer(),
          ]).process(code, { from: id });

          // Wrap output as standard Ray CSS module
          const escaped = result.css
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '');

          const urlPath = '/' + path.relative(this.projectRoot, id.split('?')[0]).replace(/\\/g, '/');
          const compiledJs = `
const css = '${escaped}';
const id = '${urlPath}';
let style = document.getElementById(id);
if (!style) {
  style = document.createElement('style');
  style.id = id;
  document.head.appendChild(style);
}
style.textContent = css;
export default css;
`;
          return { code: compiledJs };
        }
        return null;
      }
    },
    {
      name: 'custom:css-modules',
      async transform(code, id) {
        if (id.endsWith('.module.css') || id.includes('.module.css?')) {
          const classNames: Record<string, string> = {};
          const processedCss = code.replace(/\.([a-zA-Z0-9_-]+)\s*\{/g, (match, className) => {
            const hash = `${className}_${Math.random().toString(36).substring(2, 6)}`;
            classNames[className] = hash;
            return `.${hash} {`;
          });

          const escaped = processedCss
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '');

          const urlPath = '/' + path.relative(this.projectRoot, id.split('?')[0]).replace(/\\/g, '/');
          const keysStr = Object.entries(classNames)
            .map(([k, v]) => `"${k}": "${v}"`)
            .join(', ');

          const compiledJs = `
const css = '${escaped}';
const id = '${urlPath}';
let style = document.getElementById(id);
if (!style) {
  style = document.createElement('style');
  style.id = id;
  document.head.appendChild(style);
}
style.textContent = css;
export default { ${keysStr} };
`;
          return { code: compiledJs };
        }
        return null;
      }
    }
  ]
});
