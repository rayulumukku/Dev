import fs from 'fs';
import path from 'path';

export function resolveSassImport(importPath: string, currentFile: string): string | null {
  const dir = path.dirname(currentFile);
  const ext = path.extname(importPath) || (currentFile.endsWith('.sass') ? '.sass' : '.scss');
  const baseName = path.basename(importPath, ext);

  const candidates = [
    path.join(dir, `${importPath}${ext}`),
    path.join(dir, `_${baseName}${ext}`),
    path.join(dir, importPath, `index${ext}`),
    path.join(dir, importPath, `_index${ext}`),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}
