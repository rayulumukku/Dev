import { spawn, ChildProcess } from 'child_process';
import os from 'os';

export interface ProcessRunResult {
  durationMs: number;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  peakMemoryMB: number;
}

export function runProcess(command: string, args: string[], cwd: string, timeoutMs: number = 30000): Promise<ProcessRunResult> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const child: ChildProcess = spawn(command, args, { cwd, shell: true });

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
