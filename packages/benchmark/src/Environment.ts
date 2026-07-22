import os from 'os';
import { EnvironmentInfo } from './types.js';

export function captureEnvironment(): EnvironmentInfo {
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown CPU';
  const totalRamGB = Math.round((os.totalmem() / (1024 * 1024 * 1024)) * 100) / 100;

  return {
    os: `${os.type()} ${os.release()} (${os.arch()})`,
    cpu: cpuModel,
    totalRamGB,
    nodeVersion: process.version,
    packageManager: process.env.npm_config_user_agent?.split(' ')[0] || 'npm',
    rayVersion: '1.0.0',
    benchmarkVersion: '1.0.0',
  };
}
