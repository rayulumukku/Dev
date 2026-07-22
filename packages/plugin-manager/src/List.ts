import { LockfileManager } from './Lockfile.js';
import { LockfileEntry } from './types.js';

export class PluginLister {
  private lockfileManager: LockfileManager;

  constructor(projectRoot = process.cwd()) {
    this.lockfileManager = new LockfileManager(projectRoot);
  }

  list(): Record<string, LockfileEntry> {
    const lockfile = this.lockfileManager.load();
    return lockfile.plugins || {};
  }
}
