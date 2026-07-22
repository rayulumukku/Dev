export type ReleaseStrategy = 'independent' | 'synchronized';
export type BumpType = 'patch' | 'minor' | 'major' | 'prerelease';

export interface ReleaseConfig {
  strategy?: ReleaseStrategy;
  generateChangelog?: boolean;
  verifyCompatibility?: boolean;
  requireCleanGit?: boolean;
}

export interface PackageReleaseInfo {
  name: string;
  currentVersion: string;
  nextVersion: string;
  bumpType: BumpType;
  changes: string[];
}

export interface ReleasePlan {
  strategy: ReleaseStrategy;
  packages: PackageReleaseInfo[];
  publishOrder: string[];
  planTime: number;
}
