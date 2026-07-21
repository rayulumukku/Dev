import path from 'path';
import fs from 'fs';
import {
  detectConfig,
  loadConfig,
  translateViteConfig,
  generateRayConfigString,
  generateMigrationReport,
  LoadConfigResult
} from '@ray/migrate';

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

    let rayConfigString = '';
    let reportString = '';

    if (detected.type === 'vite') {
      const { rayConfig, ignoredFields, supportedFields } = translateViteConfig(loadedConfig);
      rayConfigString = generateRayConfigString(rayConfig);
      reportString = generateMigrationReport('Vite', supportedFields, ignoredFields);
    } else {
      // Webpack not implemented yet
      reportString = generateMigrationReport('Webpack', [], Object.keys(loadedConfig));
    }

    // Write outputs to cwd
    const configOutPath = path.join(cwd, 'ray.config.js');
    const reportOutPath = path.join(cwd, 'ray-migration-report.md');

    if (rayConfigString) {
      fs.writeFileSync(configOutPath, rayConfigString, 'utf-8');
      if (!options.silent) {
        console.log(`✓ Created: ray.config.js`);
      }
    }
    fs.writeFileSync(reportOutPath, reportString, 'utf-8');
    if (!options.silent) {
      console.log(`✓ Created: ray-migration-report.md`);
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
