export class SSRModuleGraph {
  private invalidations = new Set<string>();

  invalidateModule(moduleId: string): void {
    this.invalidations.add(moduleId);
  }

  isInvalidated(moduleId: string): boolean {
    return this.invalidations.has(moduleId);
  }

  clear(): void {
    this.invalidations.clear();
  }
}
