export class PackageWatcher {
  constructor() {
    this.watchedPackages = new Set();
  }

  registerPackage(pkg) {
    this.watchedPackages.add(pkg.location);
  }

  isWatched(location) {
    return this.watchedPackages.has(location);
  }

  getWatchedLocations() {
    return Array.from(this.watchedPackages);
  }
}
