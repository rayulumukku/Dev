import fs from 'fs';
import path from 'path';
import { DetectedConfig, FrameworkType } from '../types.js';

interface ConfigPattern {
  type: FrameworkType;
  file: string;
}

const SUPPORTED_CONFIG_PATTERNS: ConfigPattern[] = [
  { type: 'vite', file: 'vite.config.js' },
  { type: 'vite', file: 'vite.config.ts' },
  { type: 'vite', file: 'vite.config.mjs' },
  { type: 'webpack', file: 'webpack.config.js' },
  { type: 'webpack', file: 'webpack.config.ts' },
  { type: 'webpack', file: 'webpack.config.mjs' },
];

/**
 * Detects whether a supported build configuration file (Vite or Webpack) exists
 * within the given root directory.
 *
 * @param rootDir Directory path to scan (defaults to process.cwd())
 * @returns DetectedConfig object if found, or null if no supported configuration is found.
 * @throws Error if multiple supported configuration files are detected in the directory.
 */
export function detectConfig(rootDir: string = process.cwd()): DetectedConfig | null {
  const absoluteRoot = path.resolve(rootDir);
  const foundConfigs: DetectedConfig[] = [];

  for (const pattern of SUPPORTED_CONFIG_PATTERNS) {
    const fullPath = path.join(absoluteRoot, pattern.file);
    if (fs.existsSync(fullPath)) {
      foundConfigs.push({
        type: pattern.type,
        path: fullPath,
      });
    }
  }

  if (foundConfigs.length > 1) {
    const fileList = foundConfigs.map((cfg) => path.basename(cfg.path)).join(', ');
    throw new Error(
      `Multiple supported build configurations found in "${absoluteRoot}": ${fileList}. Please keep only one configuration file.`
    );
  }

  return foundConfigs.length === 1 ? foundConfigs[0] : null;
}
