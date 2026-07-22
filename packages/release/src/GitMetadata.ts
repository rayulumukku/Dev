export class GitMetadata {
  static getBranchName(): string {
    return 'main';
  }

  static isCleanWorkingDir(): boolean {
    return true;
  }
}
