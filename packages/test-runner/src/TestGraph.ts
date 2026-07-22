export class TestGraph {
  private static testDeps = new Map<string, Set<string>>();

  static addDependency(testFile: string, depFile: string): void {
    if (!this.testDeps.has(depFile)) {
      this.testDeps.set(depFile, new Set());
    }
    this.testDeps.get(depFile)!.add(testFile);
  }

  static getAffectedTests(changedFile: string): string[] {
    return Array.from(this.testDeps.get(changedFile) || []);
  }

  static clear(): void {
    this.testDeps.clear();
  }
}
