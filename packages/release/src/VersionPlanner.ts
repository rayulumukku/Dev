import { BumpType, PackageReleaseInfo, ReleaseStrategy } from './types.js';

export class VersionPlanner {
  static bumpVersion(version: string, bump: BumpType): string {
    const parts = version.split('.').map(n => parseInt(n, 10));
    if (parts.length < 3) return `${version}-next`;
    let [major, minor, patch] = parts;
    if (bump === 'major') major++;
    else if (bump === 'minor') minor++;
    else patch++;
    return `${major}.${minor}.${patch}`;
  }

  static planPackageReleases(
    changes: Record<string, string[]>,
    strategy: ReleaseStrategy = 'independent'
  ): PackageReleaseInfo[] {
    const infos: PackageReleaseInfo[] = [];

    for (const [pkg, commitLogs] of Object.entries(changes)) {
      const hasMajor = commitLogs.some(c => c.includes('BREAKING') || c.includes('feat!'));
      const hasMinor = commitLogs.some(c => c.startsWith('feat'));
      const bumpType: BumpType = hasMajor ? 'major' : hasMinor ? 'minor' : 'patch';
      const current = '1.0.0';
      const next = this.bumpVersion(current, bumpType);

      infos.push({
        name: pkg,
        currentVersion: current,
        nextVersion: next,
        bumpType,
        changes: commitLogs,
      });
    }

    return infos;
  }
}
