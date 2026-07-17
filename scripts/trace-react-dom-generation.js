import fs from 'fs';
import path from 'path';
import { transformCjsToEsm } from '../packages/core/dist/compiler/cjsTransform.js';

const visited = new Set();

function inlineBundle(filePath, depName) {
  const absPath = path.resolve(filePath);
  if (visited.has(absPath)) return '';
  visited.add(absPath);

  if (!fs.existsSync(absPath)) return '';
  let fileContent = fs.readFileSync(absPath, 'utf-8');

  if (fileContent.includes('module.exports') || fileContent.includes('exports.') || fileContent.includes('require(')) {
    fileContent = transformCjsToEsm(fileContent);
  }

  const dir = path.dirname(absPath);
  const relativeImportRegex = /import\s+(\w+)\s+from\s+['"](\.\/|\.\.\/)([^'"]+)['"]\s*;?/g;
  
  fileContent = fileContent.replace(relativeImportRegex, (match, importedName, dotPrefix, relPath) => {
    let nestedPath = path.resolve(dir, dotPrefix + relPath);
    if (!path.extname(nestedPath)) {
      for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.mjs']) {
        if (fs.existsSync(nestedPath + ext)) {
          nestedPath += ext;
          break;
        }
      }
    }
    return inlineBundle(nestedPath, importedName);
  });

  const relativeSideEffectRegex = /import\s+['"](\.\/|\.\.\/)([^'"]+)['"]\s*;?/g;
  fileContent = fileContent.replace(relativeSideEffectRegex, (match, dotPrefix, relPath) => {
    let nestedPath = path.resolve(dir, dotPrefix + relPath);
    if (!path.extname(nestedPath)) {
      for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.mjs']) {
        if (fs.existsSync(nestedPath + ext)) {
          nestedPath += ext;
          break;
        }
      }
    }
    return inlineBundle(nestedPath);
  });

  if (depName) {
    fileContent = fileContent.replace(/\bexport default\s+/g, `const ${depName} = `);
    fileContent = fileContent.replace(/\bexport\s+(const|let|var|function|class)\s+/g, '$1 ');
  }

  fileContent = fileContent.replace(/export\s+\*\s+from\s+['"](\.\/|\.\.\/)[^'"]+['"]\s*;?/g, '');
  fileContent = fileContent.replace(/export\s+{[^}]+}\s+from\s+['"](\.\/|\.\.\/)[^'"]+['"]\s*;?/g, '');

  return fileContent;
}

const res = inlineBundle('node_modules/react-dom/index.js');
const matches = [];
const lines = res.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED')) {
    matches.push(`Line ${i + 1}: ${lines[i].trim()}`);
  }
}
console.log('Matches in index.js bundle:', matches);
