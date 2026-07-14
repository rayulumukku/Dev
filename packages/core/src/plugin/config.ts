import { build } from 'esbuild';
import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

/**
 * Dynamically bundles and loads the ray.config.ts or ray.config.js configuration file.
 * Returns the resolved configuration object, or an empty configuration if not found.
 */
export async function loadConfig(projectRoot: string) {
  const tsConfigPath = path.join(projectRoot, 'ray.config.ts');
  const jsConfigPath = path.join(projectRoot, 'ray.config.js');

  let configPath = '';
  if (fs.existsSync(tsConfigPath)) {
    configPath = tsConfigPath;
  } else if (fs.existsSync(jsConfigPath)) {
    configPath = jsConfigPath;
  } else {
    return { plugins: [] };
  }

  const tempOut = path.join(projectRoot, '.ray', `config.timestamp.${Date.now()}.js`);
  fs.mkdirSync(path.dirname(tempOut), { recursive: true });

  await build({
    entryPoints: [configPath],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: tempOut,
    write: true,
    external: [
      '@ray/core',
      '@ray/dev-server',
      '@ray/transform',
      '@ray/hmr-runtime',
      'esbuild',
      'fsevents',
      'chokidar',
    ],
  });

  try {
    const configUrl = pathToFileURL(tempOut).toString() + `?t=${Date.now()}`;
    const module = await import(configUrl);
    return module.default || module;
  } finally {
    try {
      if (fs.existsSync(tempOut)) {
        fs.unlinkSync(tempOut);
      }
    } catch {
      // Silently cleanup
    }
  }
}
