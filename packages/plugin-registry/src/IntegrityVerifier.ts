import crypto from 'crypto';
import { IntegrityCheckResult, RayPluginManifest } from './types.js';
import { PluginVersion } from '@ray/plugin-sdk';

export class IntegrityVerifier {
  static computeChecksum(content: string | Buffer): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  static verifyManifest(manifest: RayPluginManifest, rayVersion = '1.0.0'): IntegrityCheckResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const checksum = this.computeChecksum(JSON.stringify(manifest));

    const compat = PluginVersion.checkCompatibility({ minRayVersion: manifest.ray.minimum }, rayVersion);
    if (!compat.ok && compat.reason) {
      errors.push(compat.reason);
    }

    if (manifest.ray.recommended && PluginVersion.checkCompatibility({ minRayVersion: manifest.ray.recommended }, rayVersion).ok === false) {
      warnings.push(`Recommended Ray version is ${manifest.ray.recommended}, current is ${rayVersion}`);
    }

    return {
      valid: errors.length === 0,
      checksum,
      errors,
      warnings,
    };
  }
}
