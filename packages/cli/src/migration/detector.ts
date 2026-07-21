import fs from 'fs';
import path from 'path';

export interface ConfigDetectionResult {
  found: boolean;
  framework?: 'Vite' | 'Webpack';
  configFile?: string;
  configPath?: string;
  rootDir: string;
}

const SUPPORTED_CONFIGS: Array<{ framework: 'Vite' | 'Webpack'; files: string[] }> = [
  {
    framework: 'Vite',
    files: ['vite.config.js', 'vite.config.ts', 'vite.config.mjs'],
  },
  {
    framework: 'Webpack',
    files: ['webpack.config.js', 'webpack.config.ts', 'webpack.config.mjs'],
  },
];

/**
 * Detects whether a supported build configuration file (Vite or Webpack)
 * exists within the specified target directory.
 */
export function detectConfig(rootDir: string = process.cwd()): ConfigDetectionResult {
  const absoluteRoot = path.resolve(rootDir);

  for (const group of SUPPORTED_CONFIGS) {
    for (const file of group.files) {
      const fullPath = path.join(absoluteRoot, file);
      if (fs.existsSync(fullPath)) {
        return {
          found: true,
          framework: group.framework,
          configFile: file,
          configPath: fullPath,
          rootDir: absoluteRoot,
        };
      }
    }
  }

  return {
    found: false,
    rootDir: absoluteRoot,
  };
}
