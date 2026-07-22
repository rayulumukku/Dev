import { execSync } from 'child_process';

export function detectPackageManager(env = process.env) {
  const userAgent = env.npm_config_user_agent || '';
  if (userAgent.startsWith('pnpm')) return 'pnpm';
  if (userAgent.startsWith('yarn')) return 'yarn';
  if (userAgent.startsWith('bun')) return 'bun';
  return 'npm';
}

export function getInstallCommand(pm) {
  switch (pm) {
    case 'pnpm': return 'pnpm install';
    case 'yarn': return 'yarn';
    case 'bun': return 'bun install';
    case 'npm':
    default: return 'npm install';
  }
}

export function getRunDevCommand(pm) {
  switch (pm) {
    case 'pnpm': return 'pnpm dev';
    case 'yarn': return 'yarn dev';
    case 'bun': return 'bun dev';
    case 'npm':
    default: return 'npm run dev';
  }
}

export function installDependencies(targetDir, pm) {
  const command = getInstallCommand(pm);
  execSync(command, { cwd: targetDir, stdio: 'inherit' });
}
