import chokidar from 'chokidar';
import path from 'path';

interface WatcherOptions {
  projectRoot: string;
  onChange: (filePath: string) => void;
}

/**
 * Initializes chokidar to watch code changes inside src/, public/, and index.html.
 * Debounces rapid successive triggers and filters out build/ignored directories.
 */
export function startFileWatcher(options: WatcherOptions): chokidar.FSWatcher {
  const { projectRoot, onChange } = options;

  // We explicitly watch the relevant project folders and index.html
  const watcher = chokidar.watch([
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
    ignoreInitial: true, // Skip scanning existing files on startup
  });

  let debounceTimer: NodeJS.Timeout | null = null;
  const changedFiles = new Set<string>();

  watcher.on('all', (event, filePath) => {
    if (event === 'change' || event === 'add' || event === 'unlink') {
      const absPath = path.resolve(filePath);
      changedFiles.add(absPath);

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Debounce window (40ms) to aggregate quick successive file writes
      debounceTimer = setTimeout(() => {
        for (const file of changedFiles) {
          onChange(file);
        }
        changedFiles.clear();
        debounceTimer = null;
      }, 40);
    }
  });

  return watcher;
}
