import { spawn } from 'child_process';

export function runProcess(command, args, cwd, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const child = spawn(command, args, { cwd, shell: true });

    let stdout = '';
    let stderr = '';
    let peakMemoryMB = Math.round(process.memoryUsage().rss / (1024 * 1024));

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Process timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data.toString();
        const mem = Math.round(process.memoryUsage().rss / (1024 * 1024));
        if (mem > peakMemoryMB) peakMemoryMB = mem;
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });
    }

    child.on('close', (code) => {
      clearTimeout(timer);
      const durationMs = Math.round(performance.now() - start);
      resolve({ durationMs, stdout, stderr, exitCode: code, peakMemoryMB });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
