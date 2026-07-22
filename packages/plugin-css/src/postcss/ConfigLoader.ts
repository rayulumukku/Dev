import fs from 'fs';
import path from 'path';

export interface PostCSSConfig {
  plugins?: any[];
  options?: any;
  filePath?: string;
}

const CONFIG_FILES = [
  'postcss.config.js',
  'postcss.config.cjs',
  'postcss.config.mjs',
  'postcss.config.ts',
  '.postcssrc',
  '.postcssrc.json',
  '.postcssrc.yaml',
];

export function findPostCSSConfig(rootDir: string = process.cwd()): string | null {
  let currentDir = path.resolve(rootDir);

  while (currentDir) {
    for (const name of CONFIG_FILES) {
      const fullPath = path.join(currentDir, name);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    const pkgPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.postcss) {
          return pkgPath;
        }
      } catch {}
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}
