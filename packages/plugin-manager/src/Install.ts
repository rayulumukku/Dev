import { LockfileManager } from './Lockfile.js';
import { InstallOptions } from './types.js';
import { IntegrityVerifier, PluginManifestParser } from '@ray/plugin-registry';
import fs from 'fs';
import path from 'path';

export class PluginInstaller {
  private projectRoot: string;
  private lockfileManager: LockfileManager;
  private pluginsDir: string;

  constructor(options: InstallOptions = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.lockfileManager = new LockfileManager(this.projectRoot);
    this.pluginsDir = path.join(this.projectRoot, '.ray/plugins');
  }

  install(pluginNameOrPath: string, version = '1.0.0'): { name: string; version: string; success: boolean } {
    if (!fs.existsSync(this.pluginsDir)) {
      fs.mkdirSync(this.pluginsDir, { recursive: true });
    }

    let manifest = {
      name: pluginNameOrPath,
      version: version,
      sdk: '^1.0.0',
      ray: { minimum: '1.0.0' },
    };

    const isLocal = fs.existsSync(pluginNameOrPath) && fs.statSync(pluginNameOrPath).isDirectory();
    let source = 'npm';

    if (isLocal) {
      source = `local:${pluginNameOrPath}`;
      const manifestPath = path.join(pluginNameOrPath, 'ray-plugin.json');
      if (fs.existsSync(manifestPath)) {
        manifest = PluginManifestParser.parseFile(manifestPath);
      }
    }

    const pluginName = manifest.name;
    const destDir = path.join(this.pluginsDir, pluginName.replace('/', '__'));
    fs.mkdirSync(destDir, { recursive: true });

    const manifestContent = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(path.join(destDir, 'ray-plugin.json'), manifestContent);

    const checksum = IntegrityVerifier.computeChecksum(manifestContent);

    this.lockfileManager.addEntry(pluginName, {
      version: manifest.version,
      integrity: checksum,
      source,
      sdk: manifest.sdk,
      resolvedAt: Date.now(),
    });

    return { name: pluginName, version: manifest.version, success: true };
  }
}
