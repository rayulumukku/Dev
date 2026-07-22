export class WorkspaceManager {
  private workspaceFolders: string[] = [];

  constructor(initialFolders: string[] = []) {
    this.workspaceFolders = [...initialFolders];
  }

  addFolder(folder: string): void {
    if (!this.workspaceFolders.includes(folder)) {
      this.workspaceFolders.push(folder);
    }
  }

  removeFolder(folder: string): void {
    this.workspaceFolders = this.workspaceFolders.filter(f => f !== folder);
  }

  getFolders(): string[] {
    return this.workspaceFolders;
  }
}
