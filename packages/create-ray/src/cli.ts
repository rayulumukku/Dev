import { parseCLIArgs } from './prompts.js';
import { validateProjectName, validateTargetDirectory } from './validator.js';
import { renderProject } from './renderer.js';
import { installDependencies, getInstallCommand, getRunDevCommand } from './packageManager.js';

export async function runCLI(args: string[]) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
⚡ create-ray v1.0.0
Scaffold a new high-performance Ray project in seconds.

Usage:
  create-ray [project-name] [options]

Options:
  -t, --template <template>   Template to use (react-ts, react-tailwind, vue-ts, minimal)
  --framework <framework>     Framework: react, vue, minimal (default: react)
  --lang, --language <lang>   Language: ts, js (default: ts)
  --styling <styling>         Styling: none, tailwind, css (default: none)
  --pm <package-manager>      Package manager: npm, pnpm, yarn, bun (default: auto-detected)
  --install                   Automatically install dependencies
  --overwrite                 Overwrite target directory if it exists
  -v, --version               Display version number
  -h, --help                  Display this help message
`);
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log('create-ray v1.0.0');
    return;
  }

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
