import { findPostCSSConfig } from './ConfigLoader.js';
import { runPostCSSPlugins } from './Processor.js';

export function processPostCSS(code, filename, rootDir) {
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
  } catch (err) {
    throw new Error(`[PostCSS Error in ${filename}]: ${err.message || String(err)}`);
  }
}
