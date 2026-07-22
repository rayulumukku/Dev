import { LockfileManager } from './Lockfile.js';
import fs from 'fs';
import path from 'path';

export class PluginUninstaller {
  private projectRoot: string;
  private lockfileManager: LockfileManager;
  private pluginsDir: string;

  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.lockfileManager = new LockfileManager(projectRoot);
    this.pluginsDir = path.join(projectRoot, '.ray/plugins');
  }

  uninstall(pluginName: string): { success: boolean } {
    const destDir = path.join(this.pluginsDir, pluginName.replace('/', '__'));
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
    }

    this.lockfileManager.removeEntry(pluginName);
    return { success: true };
  }
}
