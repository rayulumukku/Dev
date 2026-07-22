import { parseOverlayError } from './ErrorParser.js';
import { OverlayRecoveryTracker } from './Recovery.js';
import { OverlayUI } from './OverlayUI.js';

export class ErrorOverlayV2 {
  constructor(config = {}) {
    this.errors = new Map();
    this.recoveryTracker = new OverlayRecoveryTracker();
    this.ui = new OverlayUI();
    this.config = config;
  }

  showError(rawError, category = 'runtime') {
    const parsed = parseOverlayError(rawError, category);
    this.errors.set(parsed.id, parsed);
    this.recoveryTracker.registerError(parsed.id);
    this.ui.render(Array.from(this.errors.values()));
    return parsed;
  }

  clearError(errorId) {
    this.errors.delete(errorId);
    if (this.recoveryTracker.resolveError(errorId)) {
      this.clearAll();
    } else {
      this.ui.render(Array.from(this.errors.values()));
    }
  }

  clearAll() {
    this.errors.clear();
    this.recoveryTracker.clearAll();
    this.ui.unmount();
  }

  getErrors() {
    return Array.from(this.errors.values());
  }

  hasErrors() {
    return this.errors.size > 0;
  }
}

export const createErrorOverlayV2 = (config) => new ErrorOverlayV2(config);
