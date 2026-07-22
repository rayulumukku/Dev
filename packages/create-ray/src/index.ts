export * from './types.js';
export * from './validator.js';
export * from './packageManager.js';
export * from './renderer.js';
export * from './templates.js';
export * from './prompts.js';
export * from './cli.js';

import { runCLI } from './cli.js';

export async function runCreate(args: string[]) {
  return runCLI(args);
}
