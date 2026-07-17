import fs from 'fs';
import path from 'path';
import { transformCjsToEsm } from '../packages/core/dist/compiler/cjsTransform.js';

function inlineBundle(filePath, depName) {
  const absPath = path.resolve(filePath);
  let fileContent = fs.readFileSync(absPath, 'utf-8');

  console.log(`\n--- inlineBundle START for ${path.basename(filePath)} ---`);
  if (fileContent.includes('module.exports') || fileContent.includes('exports.') || fileContent.includes('require(')) {
    fileContent = transformCjsToEsm(fileContent);
    console.log('After CJS-to-ESM, includes export const:', fileContent.includes('export const createPortal'));
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
    const res = inlineBundle(nestedPath, importedName);
    return res;
  });

  if (depName) {
    fileContent = fileContent.replace(/\bexport default\s+/g, `const ${depName} = `);
    fileContent = fileContent.replace(/export\s+const\s+[a-zA-Z0-9_$]+\s*=\s*__cjs_module_[a-zA-Z0-9_$]+__\.exports\.[a-zA-Z0-9_$]+;?/g, '');
    fileContent = fileContent.replace(/\bexport\s+(const|let|var|function|class)\s+/g, '$1 ');
  }

  fileContent = fileContent.replace(/export\s+\*\s+from\s+['"](\.\/|\.\.\/)[^'"]+['"]\s*;?/g, '');
  fileContent = fileContent.replace(/export\s+{[^}]+}\s+from\s+['"](\.\/|\.\.\/)[^'"]+['"]\s*;?/g, '');

  console.log(`--- inlineBundle END for ${path.basename(filePath)} ---`);
  console.log('Includes export const:', fileContent.includes('export const createPortal'));

  return fileContent;
}

inlineBundle('node_modules/react-dom/index.js');
