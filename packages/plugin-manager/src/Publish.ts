import { PluginManifestParser } from '@ray/plugin-registry';
import { PublishOptions } from './types.js';
import fs from 'fs';
import path from 'path';

export class PluginPublisher {
  private projectRoot: string;

  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  publish(options: PublishOptions = {}): { valid: boolean; errors: string[]; name: string; version: string } {
    const manifestPath = path.join(this.projectRoot, 'ray-plugin.json');
    const pkgPath = path.join(this.projectRoot, 'package.json');
    const errors: string[] = [];

    if (!fs.existsSync(manifestPath)) {
      errors.push('Missing ray-plugin.json manifest file.');
      return { valid: false, errors, name: 'unknown', version: '0.0.0' };
    }

    if (!fs.existsSync(pkgPath)) {
      errors.push('Missing package.json file.');
      return { valid: false, errors, name: 'unknown', version: '0.0.0' };
    }

    try {
      const manifest = PluginManifestParser.parseFile(manifestPath);
      if (!manifest.description) {
        errors.push('Manifest ray-plugin.json must contain a description.');
      }
      if (!manifest.keywords || manifest.keywords.length === 0) {
        errors.push('Manifest ray-plugin.json should define keywords.');
      }

      return {
        valid: errors.length === 0,
        errors,
        name: manifest.name,
        version: manifest.version,
      };
    } catch (err: any) {
      errors.push(`Manifest validation failed: ${err.message}`);
      return { valid: false, errors, name: 'unknown', version: '0.0.0' };
    }
  }
}
