import { runProcess } from './ProcessRunner.js';

export async function measureColdStart(workspaceDir: string): Promise<number> {
  const start = performance.now();
  // Simulate cold start verification
  const res = await runProcess('node', ['-e', '"console.log(\'cold start test\')"'], workspaceDir);
  return res.durationMs || Math.round(performance.now() - start);
}
