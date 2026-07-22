import { runProcess } from './ProcessRunner.js';

export async function measureColdStart(workspaceDir) {
  const start = performance.now();
  const res = await runProcess('node', ['-e', '"console.log(\'cold start test\')"'], workspaceDir);
  return res.durationMs || Math.round(performance.now() - start);
}
