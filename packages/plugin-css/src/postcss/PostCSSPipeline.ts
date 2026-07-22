import { findPostCSSConfig } from './ConfigLoader.js';
import { runPostCSSPlugins } from './Processor.js';

export function processPostCSS(code: string, filename: string, rootDir?: string): { code: string; map?: any; hasConfig: boolean } {
  const configPath = findPostCSSConfig(rootDir || process.cwd());

  if (!configPath) {
    return { code, hasConfig: false };
  }

  try {
    const processedCode = runPostCSSPlugins(code, []);
    return {
      code: processedCode,
      hasConfig: true,
    };
  } catch (err: any) {
    throw new Error(`[PostCSS Error in ${filename}]: ${err.message || String(err)}`);
  }
}
