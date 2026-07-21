import path from 'path';
import { detectConfig, loadConfig, LoadConfigResult } from '@ray/migrate';

export interface MigrateCommandOptions {
  cwd?: string;
  silent?: boolean;
}

export interface MigrateCommandResult {
  exitCode: number;
  data?: LoadConfigResult;
  error?: Error;
}

/**
 * CLI command handler for `ray migrate`.
 * Uses @ray/migrate package to detect and load Vite or Webpack configuration files safely.
 */
export async function runMigrateCommand(options: MigrateCommandOptions = {}): Promise<MigrateCommandResult> {
  const cwd = path.resolve(options.cwd || process.cwd());

  try {
    const detected = detectConfig(cwd);

    if (!detected) {
      if (!options.silent) {
        console.log(`✗ Failed to load configuration`);
        console.log(`Reason: No supported configuration file found.`);
      }
      return {
        exitCode: 1,
        error: new Error(`No supported configuration file found.`),
      };
    }

    const frameworkName = detected.type === 'vite' ? 'Vite' : 'Webpack';

    if (!options.silent) {
      console.log(`✓ Project Root: ${cwd}`);
      console.log(`✓ Framework Detected: ${frameworkName}`);
    }

    const loadedConfig = await loadConfig(detected.path);

    if (!options.silent) {
      console.log(`✓ Config Loaded Successfully`);
    }

    return {
      exitCode: 0,
      data: {
        config: loadedConfig,
        framework: detected.type,
        configPath: detected.path,
      },
    };
  } catch (err: any) {
    if (!options.silent) {
      console.log(`✗ Failed to load configuration`);
      console.log(`Reason: ${err.message || String(err)}`);
    }
    return {
      exitCode: 1,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}
