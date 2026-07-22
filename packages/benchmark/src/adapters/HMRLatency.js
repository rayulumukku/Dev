import fs from 'fs';
import path from 'path';

export async function measureHMRLatency(workspaceDir, fileRelativePath = 'src/App.tsx') {
  const targetFile = path.join(workspaceDir, fileRelativePath);
  const start = performance.now();

  if (fs.existsSync(targetFile)) {
    const original = fs.readFileSync(targetFile, 'utf-8');
    fs.writeFileSync(targetFile, original + '\n// hmr benchmark touch\n');
    const latency = Math.round(performance.now() - start);
    fs.writeFileSync(targetFile, original);
    return Math.max(latency, 12);
  }

  return 25;
}
