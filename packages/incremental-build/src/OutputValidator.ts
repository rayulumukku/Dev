import { BuildManifest } from './types.js';
import { ChangeDetector } from './ChangeDetector.js';
import fs from 'fs';
import path from 'path';

export class OutputValidator {
  private changeDetector = new ChangeDetector();

  validateOutput(
    outDir: string,
    expectedManifest: BuildManifest
  ): { valid: boolean; mismatches: string[] } {
    const mismatches: string[] = [];

    if (!fs.existsSync(outDir)) {
      return { valid: false, mismatches: ['Output directory does not exist'] };
    }

    for (const [artPath, artMeta] of Object.entries(expectedManifest.artifacts || {})) {
      const fullPath = path.join(outDir, artPath);
      if (!fs.existsSync(fullPath)) {
        mismatches.push(`Missing artifact output file: ${artPath}`);
        continue;
      }

      try {
        const fileContent = fs.readFileSync(fullPath);
        const actualHash = this.changeDetector.computeContentHash(fileContent);
        if (artMeta.hash && artMeta.hash !== actualHash) {
          mismatches.push(`Hash mismatch for ${artPath}: expected ${artMeta.hash}, got ${actualHash}`);
        }
      } catch (err: any) {
        mismatches.push(`Failed to read ${artPath}: ${err.message}`);
      }
    }

    return {
      valid: mismatches.length === 0,
      mismatches,
    };
  }
}
