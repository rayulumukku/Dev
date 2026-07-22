export class FileWatcherIndex {
  constructor() {
    this.invalidations = new Set();
  }

  markInvalid(filePath) {
    this.invalidations.add(filePath);
  }

  isInvalid(filePath) {
    return this.invalidations.has(filePath);
  }

  clear() {
    this.invalidations.clear();
  }
}
