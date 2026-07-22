import path from 'path';
import { generateProject } from './templates/Generator.js';

export async function runCreate(args) {
  let targetName = args[0];
  let template = 'react-ts';

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--template' || args[i] === '-t') && args[i + 1]) {
      template = args[i + 1];
    }
  }

  if (!targetName || targetName.startsWith('-')) {
    targetName = 'my-ray-app';
  }

  const isDotPath = targetName === '.';
  const targetDir = isDotPath ? process.cwd() : path.resolve(process.cwd(), targetName);
  const projectName = isDotPath ? path.basename(targetDir) : targetName;

  console.log(`\n⚡ [Create Ray] Scaffolding project "${projectName}" using template "${template}"...`);

  generateProject({
    projectName,
    targetDir,
    template
  });

  console.log(`\n🎉 Project "${projectName}" created successfully!`);
  console.log('\nNext steps:');
  if (!isDotPath) {
    console.log(`  cd ${projectName}`);
  }
  console.log('  npm install');
  console.log('  npm run dev\n');
}

export * from './templates/Generator.js';
