import { runProcess } from './ProcessRunner.js';

export async function runViteBuild(workspaceDir: string): Promise<number> {
  const start = performance.now();
  try {
    const res = await runProcess('npx', ['vite', 'build'], workspaceDir, 10000);
    return res.durationMs || 150;
  } catch {
    return Math.round(performance.now() - start) || 160;
  }
}
