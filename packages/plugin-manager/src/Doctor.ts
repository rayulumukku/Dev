import { LockfileManager } from './Lockfile.js';
import { DoctorReport, DoctorIssue } from './types.js';
import fs from 'fs';
import path from 'path';

export class PluginDoctor {
  private projectRoot: string;
  private lockfileManager: LockfileManager;
  private pluginsDir: string;

  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.lockfileManager = new LockfileManager(projectRoot);
    this.pluginsDir = path.join(projectRoot, '.ray/plugins');
  }

  diagnose(rayVersion = '1.0.0'): DoctorReport {
    const issues: DoctorIssue[] = [];
    const lockfile = this.lockfileManager.load();
    const installedNames = new Set<string>();

    for (const [name, entry] of Object.entries(lockfile.plugins)) {
      if (installedNames.has(name)) {
        issues.push({
          type: 'error',
          plugin: name,
          code: 'DUPLICATE_PLUGIN',
          message: `Duplicate plugin registration detected for "${name}"`,
        });
      }
      installedNames.add(name);

      const pluginFolder = path.join(this.pluginsDir, name.replace('/', '__'));
      if (!fs.existsSync(pluginFolder)) {
        issues.push({
          type: 'error',
          plugin: name,
          code: 'CORRUPTED_INSTALL',
          message: `Plugin directory missing for installed plugin "${name}"`,
        });
      } else {
        const manifestPath = path.join(pluginFolder, 'ray-plugin.json');
        if (!fs.existsSync(manifestPath)) {
          issues.push({
            type: 'error',
            plugin: name,
            code: 'MISSING_MANIFEST',
            message: `Manifest ray-plugin.json missing for plugin "${name}"`,
          });
        }
      }
    }

    return {
      healthy: issues.filter(i => i.type === 'error').length === 0,
      issues,
    };
  }
}
