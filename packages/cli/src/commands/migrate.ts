import { detectConfig, ConfigDetectionResult } from '../migration/detector.js';

export interface MigrateCommandOptions {
  cwd?: string;
  silent?: boolean;
}

export interface MigrateCommandResult {
  exitCode: number;
  detection: ConfigDetectionResult;
}

/**
 * CLI command handler for `ray migrate`.
 * Detects existing Vite or Webpack configurations in the target directory and prints a clean report.
 */
export function runMigrateCommand(options: MigrateCommandOptions = {}): MigrateCommandResult {
  const cwd = options.cwd || process.cwd();
  const detection = detectConfig(cwd);

  if (!options.silent) {
    if (detection.found) {
      console.log(`✓ Project Root: ${detection.rootDir}`);
      console.log(`✓ Detected: ${detection.framework}`);
      console.log(`✓ Config: ${detection.configFile}`);
    } else {
      console.log(`✗ No supported configuration found.`);
    }
  }

  const exitCode = detection.found ? 0 : 1;
  return { exitCode, detection };
}
