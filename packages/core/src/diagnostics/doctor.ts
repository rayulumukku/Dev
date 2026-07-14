import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

interface DoctorReport {
  nodeVersion: string;
  nodeOk: boolean;
  packageManager: string;
  cacheHealthy: boolean;
  cacheDetails: string;
  configOk: boolean;
  configIssues: string[];
  envOk: boolean;
  envIssues: string[];
}

/**
 * Runs active diagnostic routines, validating system, config, and caches health.
 */
export async function runDoctor(projectRoot: string): Promise<DoctorReport> {
  const issues: string[] = [];
  const envIssues: string[] = [];

  // 1. Node Version check
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  const nodeOk = major >= 18;

  // 2. Package Manager detection
  let packageManager = 'Unknown';
  if (fs.existsSync(path.join(projectRoot, 'package-lock.json'))) {
    packageManager = 'npm';
  } else if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm';
  } else if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) {
    packageManager = 'yarn';
  }

  // 3. Cache health check
  const cacheDir = path.join(projectRoot, '.ray/cache');
  const metadataPath = path.join(cacheDir, 'metadata.json');
  let cacheHealthy = false;
  let cacheDetails = 'No cache initialized.';

  if (fs.existsSync(metadataPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      if (meta.hash && meta.optimized) {
        const count = Object.keys(meta.optimized).length;
        cacheHealthy = true;
        cacheDetails = `Cache OK (${count} pre-bundled dependencies cached).`;
      } else {
        cacheDetails = 'Cache metadata is corrupt or incomplete.';
      }
    } catch {
      cacheDetails = 'Failed to parse metadata.json cache descriptor.';
    }
  }

  // 4. Config validation
  let configOk = true;
  const configPath = path.join(projectRoot, 'ray.config.ts');
  if (fs.existsSync(configPath)) {
    try {
      const configText = fs.readFileSync(configPath, 'utf-8');
      if (configText.includes('defineConfig')) {
        // Basic static verification
        configDetailsCheck(configText, issues);
      }
    } catch (err: any) {
      configOk = false;
      issues.push(`Error loading ray.config.ts: ${err.message}`);
    }
  } else {
    configDetailsCheck('', issues);
  }

  if (issues.length > 0) {
    configOk = false;
  }

  // 5. Env variables safety check
  let envOk = true;
  const envFiles = ['.env', '.env.local', '.env.development', '.env.development.local'];
  for (const file of envFiles) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const sensitiveKeywords = ['SECRET', 'PASSWORD', 'KEY', 'DATABASE', 'TOKEN', 'JWT'];
          const isSensitive = sensitiveKeywords.some(keyword => key.toUpperCase().includes(keyword));
          if (isSensitive && key.startsWith('RAY_')) {
            envIssues.push(`Potential Leak: Variable "${key}" in "${file}" is sensitive but uses the "RAY_" prefix, exposing it to client bundles.`);
          }
        }
      }
    }
  }

  if (envIssues.length > 0) {
    envOk = false;
  }

  return {
    nodeVersion: version,
    nodeOk,
    packageManager,
    cacheHealthy,
    cacheDetails,
    configOk,
    configIssues: issues,
    envOk,
    envIssues,
  };
}

function configDetailsCheck(configText: string, issues: string[]) {
  // Checks for invalid option types or parameters
  if (configText.includes('optimizeDeps:')) {
    if (configText.includes('include') && !configText.includes('include: [')) {
      issues.push('Option "optimizeDeps.include" must be an Array.');
    }
  }
}

/**
 * Renders doctor results to console.
 */
export function printDoctorReport(report: DoctorReport) {
  console.log('\n🩺 Ray CLI Doctor Diagnostic Report 🩺\n');

  console.log(`[${report.nodeOk ? '✔' : '❌'}] Node.js Environment`);
  console.log(`    Active Version: ${report.nodeVersion} (${report.nodeOk ? 'Supported' : 'Please upgrade to Node >= 18'})`);

  console.log(`[✔] Package Manager`);
  console.log(`    Detected tool:  ${report.packageManager}`);

  console.log(`[${report.cacheHealthy ? '✔' : '⚠'}] Cache Integrity`);
  console.log(`    Status:         ${report.cacheDetails}`);

  console.log(`[${report.configOk ? '✔' : '❌'}] Project Configuration`);
  if (report.configOk) {
    console.log('    Status:         ray.config.ts validated cleanly.');
  } else {
    console.log('    Issues identified:');
    report.configIssues.forEach(iss => console.log(`      - ${iss}`));
  }

  console.log(`[${report.envOk ? '✔' : '⚠'}] Environment Security`);
  if (report.envOk) {
    console.log('    Status:         No potential client leaks detected.');
  } else {
    console.log('    Security warnings:');
    report.envIssues.forEach(iss => console.log(`      - ${iss}`));
  }

  console.log('\n----------------------------------------\n');
}
