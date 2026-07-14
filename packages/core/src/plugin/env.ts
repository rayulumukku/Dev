import fs from 'fs';
import path from 'path';

/**
 * Parses raw environment configuration file text into key-value pairs.
 */
export function parseEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

/**
 * Loads, validates, and merges environment variables according to Mode priorities.
 */
export function loadEnv(mode: string, projectRoot: string, prefix = 'RAY_'): Record<string, string> {
  const env: Record<string, string> = {};

  const files = [
    '.env',
    '.env.local',
    `.env.${mode}`,
    `.env.${mode}.local`
  ];

  for (const file of files) {
    if (file === '.env.local' && mode === 'test') continue;
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = parseEnv(content);
      Object.assign(env, parsed);
    }
  }

  // Fallback to match process.env keys
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(prefix) && value !== undefined) {
      env[key] = value;
    }
  }

  return env;
}
