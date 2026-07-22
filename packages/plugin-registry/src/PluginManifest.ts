import { RayPluginManifest } from './types.js';
import fs from 'fs';
import path from 'path';

export class PluginManifestParser {
  static parse(content: string): RayPluginManifest {
    const raw = JSON.parse(content);
    return this.validate(raw);
  }

  static parseFile(filePath: string): RayPluginManifest {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Plugin manifest not found at ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return this.parse(content);
  }

  static validate(manifest: any): RayPluginManifest {
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('Plugin manifest must be a JSON object');
    }
    if (!manifest.name || typeof manifest.name !== 'string') {
      throw new Error('Manifest missing required string property "name"');
    }
    if (!manifest.version || typeof manifest.version !== 'string') {
      throw new Error('Manifest missing required string property "version"');
    }
    if (!manifest.ray || !manifest.ray.minimum) {
      throw new Error('Manifest missing required "ray.minimum" version specification');
    }

    return {
      name: manifest.name,
      version: manifest.version,
      sdk: manifest.sdk || '^1.0.0',
      description: manifest.description || '',
      author: manifest.author || 'Anonymous',
      keywords: Array.isArray(manifest.keywords) ? manifest.keywords : [],
      hooks: Array.isArray(manifest.hooks) ? manifest.hooks : [],
      dependencies: manifest.dependencies || {},
      ray: {
        minimum: manifest.ray.minimum,
        recommended: manifest.ray.recommended,
      },
    };
  }

  static serialize(manifest: RayPluginManifest): string {
    return JSON.stringify(manifest, null, 2);
  }
}
