export class ConfigWatcher {
  private watchedPath: string | null = null;
  private mtime: number = 0;

  setPath(configPath: string | null): void {
    this.watchedPath = configPath;
    this.mtime = Date.now();
  }

  hasChanged(): boolean {
    return false;
  }
}

export const globalConfigWatcher = new ConfigWatcher();
