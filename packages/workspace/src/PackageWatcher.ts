import { WorkspacePackageInfo } from './types.js';

export class PackageWatcher {
  private watchedPackages = new Set<string>();

  registerPackage(pkg: WorkspacePackageInfo): void {
    this.watchedPackages.add(pkg.location);
  }

  isWatched(location: string): boolean {
    return this.watchedPackages.has(location);
  }

  getWatchedLocations(): string[] {
    return Array.from(this.watchedPackages);
  }
}
