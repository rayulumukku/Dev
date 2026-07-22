import { parseCLIArgs } from './prompts.js';
import { validateProjectName, validateTargetDirectory } from './validator.js';
import { renderProject } from './renderer.js';
import { installDependencies, getInstallCommand, getRunDevCommand } from './packageManager.js';

export async function runCLI(args: string[]) {
  const options = await parseCLIArgs(args);

  const nameVal = validateProjectName(options.projectName);
  if (!nameVal.valid) {
    throw new Error(nameVal.error);
  }

  const dirVal = validateTargetDirectory(options.targetDir, options.overwrite);
  if (!dirVal.valid) {
    throw new Error(dirVal.error);
  }

  console.log(`\n⚡ [Create Ray] Scaffolding "${options.projectName}" (${options.framework}, ${options.language}, ${options.styling})...`);

  renderProject(options);

  if (options.installDeps) {
    console.log(`\n📦 Installing dependencies using ${options.packageManager}...`);
    installDependencies(options.targetDir, options.packageManager);
  }

  console.log(`\n🎉 Project created successfully!`);
  console.log('\nNext steps:');
  if (options.targetDir !== process.cwd()) {
    console.log(`  cd ${options.projectName}`);
  }
  if (!options.installDeps) {
    console.log(`  ${getInstallCommand(options.packageManager)}`);
  }
  console.log(`  ${getRunDevCommand(options.packageManager)}\n`);
}
