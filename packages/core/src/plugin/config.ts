import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { RayCompiler } from '../compiler/index.js';

/**
 * loadConfig
 *
 * Dynamically transpiles and evaluates the ray.config.ts / ray.config.js
 * configuration file using Ray's own compiler — no esbuild dependency.
 *
 * Strategy:
 *  1. Read source with fs
 *  2. Compile TypeScript/JSX to ESM via RayCompiler.compile()
 *  3. Write compiled output to a timestamped .js temp file under .ray/
 *  4. dynamic import() the temp file
 *  5. Clean up the temp file
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

  const src = fs.readFileSync(configPath, 'utf-8');

  // Compile with RayCompiler
  let compiled = src;
  try {
    const compiler = new RayCompiler({});
    const result = compiler.compile(src, configPath);
    compiled = result.code;
  } catch {
    // If Ray compiler fails on config syntax, use raw source (already JS)
    compiled = src;
  }

  const tempOut = path.join(projectRoot, '.ray', `config.timestamp.${Date.now()}.mjs`);
  fs.mkdirSync(path.dirname(tempOut), { recursive: true });
  fs.writeFileSync(tempOut, compiled, 'utf-8');

  try {
    const configUrl = pathToFileURL(tempOut).toString() + `?t=${Date.now()}`;
    const mod = await import(/* @vite-ignore */ configUrl);
    return mod.default || mod;
  } finally {
    try {
      if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut);
    } catch {
      // Silently ignore cleanup failure
    }
  }
}
