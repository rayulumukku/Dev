export class FileWatcherIndex {
  private invalidations = new Set<string>();

  markInvalid(filePath: string): void {
    this.invalidations.add(filePath);
  }

  isInvalid(filePath: string): boolean {
    return this.invalidations.has(filePath);
  }

  clear(): void {
    this.invalidations.clear();
  }
}
