import path from 'path';
import { detectPackageManager } from './packageManager.js';

export async function parseCLIArgs(args) {
  let targetName = 'my-ray-app';
  let framework = 'react';
  let language = 'ts';
  let styling = 'none';
  let packageManager = detectPackageManager();
  let overwrite = false;
  let installDeps = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--template' || arg === '-t') {
      const val = args[i + 1] || '';
      if (val.includes('vue')) framework = 'vue';
      else if (val.includes('minimal')) framework = 'minimal';
      else framework = 'react';

      if (val.includes('js')) language = 'js';
      else language = 'ts';
      i++;
    } else if (arg === '--framework') {
      framework = args[i + 1] || 'react';
      i++;
    } else if (arg === '--lang' || arg === '--language') {
      language = args[i + 1] || 'ts';
      i++;
    } else if (arg === '--styling') {
      styling = args[i + 1] || 'none';
      i++;
    } else if (arg === '--pm') {
      packageManager = args[i + 1] || 'npm';
      i++;
    } else if (arg === '--overwrite') {
      overwrite = true;
    } else if (arg === '--install') {
      installDeps = true;
    } else if (!arg.startsWith('-') && i === 0) {
      targetName = arg;
    }
  }

  const targetDir = path.resolve(process.cwd(), targetName);
  const projectName = path.basename(targetDir);

  return {
    projectName,
    targetDir,
    framework,
    language,
    styling,
    packageManager,
    overwrite,
    installDeps
  };
}
