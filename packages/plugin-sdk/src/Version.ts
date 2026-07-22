import { PluginVersionSpec } from './types.js';

export class PluginVersion {
  static checkCompatibility(spec: PluginVersionSpec, rayVersion = '1.0.0'): { ok: boolean; reason?: string } {
    if (!spec) return { ok: true };

    if (spec.minRayVersion && !this.isGreaterOrEqual(rayVersion, spec.minRayVersion)) {
      return {
        ok: false,
        reason: `Ray version ${rayVersion} is lower than plugin required minRayVersion ${spec.minRayVersion}`,
      };
    }

    if (spec.maxRayVersion && this.isGreater(rayVersion, spec.maxRayVersion)) {
      return {
        ok: false,
        reason: `Ray version ${rayVersion} exceeds plugin tested maxRayVersion ${spec.maxRayVersion}`,
      };
    }

    return { ok: true };
  }

  private static parseVersion(v: string): number[] {
    return v.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
  }

  private static isGreaterOrEqual(v1: string, v2: string): boolean {
    const p1 = this.parseVersion(v1);
    const p2 = this.parseVersion(v2);

    for (let i = 0; i < 3; i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return true;
      if (n1 < n2) return false;
    }
    return true;
  }

  private static isGreater(v1: string, v2: string): boolean {
    const p1 = this.parseVersion(v1);
    const p2 = this.parseVersion(v2);

    for (let i = 0; i < 3; i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return true;
      if (n1 < n2) return false;
    }
    return false;
  }
}
