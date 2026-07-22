import { OverlayError, ErrorCategory, OverlayConfig } from './types.js';
import { parseOverlayError } from './ErrorParser.js';
import { OverlayRecoveryTracker } from './Recovery.js';
import { OverlayUI } from './OverlayUI.js';

export class ErrorOverlayV2 {
  private errors = new Map<string, OverlayError>();
  private recoveryTracker = new OverlayRecoveryTracker();
  private ui = new OverlayUI();
  private config: OverlayConfig;

  constructor(config: OverlayConfig = {}) {
    this.config = config;
  }

  showError(rawError: any, category: ErrorCategory = 'runtime'): OverlayError {
    const parsed = parseOverlayError(rawError, category);
    this.errors.set(parsed.id, parsed);
    this.recoveryTracker.registerError(parsed.id);
    this.ui.render(Array.from(this.errors.values()));
    return parsed;
  }

  clearError(errorId: string): void {
    this.errors.delete(errorId);
    if (this.recoveryTracker.resolveError(errorId)) {
      this.clearAll();
    } else {
      this.ui.render(Array.from(this.errors.values()));
    }
  }

  clearAll(): void {
    this.errors.clear();
    this.recoveryTracker.clearAll();
    this.ui.unmount();
  }

  getErrors(): OverlayError[] {
    return Array.from(this.errors.values());
  }

  hasErrors(): boolean {
    return this.errors.size > 0;
  }
}

export const createErrorOverlayV2 = (config?: OverlayConfig) => new ErrorOverlayV2(config);
