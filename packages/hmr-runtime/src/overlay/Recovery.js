export class OverlayRecoveryTracker {
  constructor() {
    this.activeErrors = new Set();
  }

  registerError(errorId) {
    this.activeErrors.add(errorId);
  }

  resolveError(errorId) {
    this.activeErrors.delete(errorId);
    return this.activeErrors.size === 0;
  }

  clearAll() {
    this.activeErrors.clear();
  }

  hasErrors() {
    return this.activeErrors.size > 0;
  }
}
