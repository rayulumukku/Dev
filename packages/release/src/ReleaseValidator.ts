import { GitMetadata } from './GitMetadata.js';

export class ReleaseValidator {
  static validateWorkspace(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!GitMetadata.isCleanWorkingDir()) {
      errors.push('Working directory has uncommitted changes');
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
