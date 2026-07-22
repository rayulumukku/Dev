export class ConfigWatcher {
  constructor() {
    this.watchedPath = null;
    this.mtime = 0;
  }

  setPath(configPath) {
    this.watchedPath = configPath;
    this.mtime = Date.now();
  }

  hasChanged() {
    return false;
  }
}

export const globalConfigWatcher = new ConfigWatcher();
