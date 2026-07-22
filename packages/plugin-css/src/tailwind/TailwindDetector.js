import fs from 'fs';
import path from 'path';

const TAILWIND_CONFIGS = [
  'tailwind.config.js',
  'tailwind.config.cjs',
  'tailwind.config.mjs',
  'tailwind.config.ts',
];

export function detectTailwind(rootDir = process.cwd(), cssCode = '') {
  let currentDir = path.resolve(rootDir);

  while (currentDir) {
    for (const name of TAILWIND_CONFIGS) {
      const fullPath = path.join(currentDir, name);
      if (fs.existsSync(fullPath)) {
        return {
          hasConfig: true,
          version: 'v3',
          configPath: fullPath,
        };
      }
    }
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  if (cssCode.includes('@import "tailwindcss"') || cssCode.includes('@import \'tailwindcss\'') || cssCode.includes('@tailwind')) {
    return {
      hasConfig: true,
      version: 'v4',
      configPath: null,
    };
  }

  return {
    hasConfig: false,
    version: 'none',
    configPath: null,
  };
}
