export class OverlayRecoveryTracker {
  private activeErrors = new Set<string>();

  registerError(errorId: string): void {
    this.activeErrors.add(errorId);
  }

  resolveError(errorId: string): boolean {
    this.activeErrors.delete(errorId);
    return this.activeErrors.size === 0;
  }

  clearAll(): void {
    this.activeErrors.clear();
  }

  hasErrors(): boolean {
    return this.activeErrors.size > 0;
  }
}
