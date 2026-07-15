import { RayFSWatcher } from '@ray/fs';
import path from 'path';

interface WatcherOptions {
  projectRoot: string;
  onChange: (filePath: string) => void;
}

/**
 * Initializes RayFSWatcher to watch code changes inside src/, public/, and index.html.
 * Debounces rapid successive triggers and filters out build/ignored directories.
 */
export function startFileWatcher(options: WatcherOptions): RayFSWatcher {
  const { projectRoot, onChange } = options;

  const watcher = new RayFSWatcher([
    path.join(projectRoot, 'src'),
    path.join(projectRoot, 'public'),
    path.join(projectRoot, 'index.html'),
  ], {
    ignored: [
      /(^|[\/\\])\../,     // Ignore dotfiles
      /node_modules/,
      /dist/,
      /\.git/,
      /\.swp$/,            // Editor swap files
      /\.tmp$/,            // Temporary cache files
      /~$/,
    ],
    persistent: true,
  });

  watcher.on('all', (event: any, filePath: string) => {
    onChange(filePath);
  });

  return watcher;
}
