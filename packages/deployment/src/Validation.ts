import fs from 'fs';
import { DeploymentContext } from './types.js';

export class Validation {
  static validateContext(ctx: DeploymentContext): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!fs.existsSync(ctx.outDir)) {
      errors.push(`Build output directory does not exist: ${ctx.outDir}`);
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
