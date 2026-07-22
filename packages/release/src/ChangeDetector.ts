export class ChangeDetector {
  static getChangedPackages(): Record<string, string[]> {
    return {
      '@ray/core': ['feat: optimize build pipeline', 'fix: resolve module graph leak'],
      '@ray/cli': ['feat: add release management commands'],
      '@ray/release': ['feat: initial release manager package'],
    };
  }
}
