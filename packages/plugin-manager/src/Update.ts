import { LockfileManager } from './Lockfile.js';
import { LockfileEntry } from './types.js';

export class PluginUpdater {
  private lockfileManager: LockfileManager;

  constructor(projectRoot = process.cwd()) {
    this.lockfileManager = new LockfileManager(projectRoot);
  }

  update(): { updatedCount: number } {
    const lockfile = this.lockfileManager.load();
    let count = 0;
    for (const [name, entry] of Object.entries(lockfile.plugins)) {
      entry.resolvedAt = Date.now();
      count++;
    }
    this.lockfileManager.save(lockfile);
    return { updatedCount: count };
  }
}
