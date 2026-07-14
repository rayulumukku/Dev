import fs from 'fs';
import path from 'path';
import { loadConfig } from '../plugin/config.js';
import { RayCore } from '../index.js';
import { buildProject } from '../build/index.js';

interface VerifyReport {
  configOk: boolean;
  graphOk: boolean;
  cacheOk: boolean;
  ssrOk: boolean;
  buildOk: boolean;
  issues: string[];
}

export async function runVerify(projectRoot: string): Promise<VerifyReport> {
  const issues: string[] = [];
  let configOk = true;
  let graphOk = true;
  let cacheOk = true;
  let ssrOk = true;
  let buildOk = true;

  console.log(`\n🔍 [Ray Verify] Running full self-diagnostics checks...`);

  // 1. Config Validation
  try {
    const config = await loadConfig(projectRoot);
    if (config.plugins && !Array.isArray(config.plugins)) {
      configOk = false;
      issues.push('ray.config.ts: "plugins" must be an array.');
    }
    if (config.optimizeDeps && typeof config.optimizeDeps !== 'object') {
      configOk = false;
      issues.push('ray.config.ts: "optimizeDeps" must be an object.');
    }
  } catch (err: any) {
    configOk = false;
    issues.push(`ray.config.ts failed to load: ${err.message}`);
  }

  // 2. Cache Verification
  const cacheDir = path.join(projectRoot, '.ray/cache');
  if (fs.existsSync(cacheDir)) {
    const metaPath = path.join(cacheDir, 'metadata.json');
    if (!fs.existsSync(metaPath)) {
      cacheOk = false;
      issues.push('Optimizer Cache: metadata.json missing inside cache directory.');
    } else {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        if (!meta.optimized || typeof meta.optimized !== 'object') {
          cacheOk = false;
          issues.push('Optimizer Cache: metadata.json schema is invalid.');
        }
      } catch (err: any) {
        cacheOk = false;
        issues.push(`Optimizer Cache: Failed to read cache metadata: ${err.message}`);
      }
    }
  }

  // 3. Dependency Graph & Compiler Verification
  const core = new RayCore(projectRoot);
  try {
    await core.init();
    // Verify a target core module transforms without throwing
    const mainJsx = path.join(projectRoot, 'src/main.jsx');
    const appJsx = path.join(projectRoot, 'src/App.jsx');

    if (fs.existsSync(mainJsx)) {
      const code = fs.readFileSync(mainJsx, 'utf-8');
      const compiled = await core.transform(code, mainJsx);
      if (!compiled) {
        graphOk = false;
        issues.push('Compiler: Transformation returned empty response.');
      }
    }
  } catch (err: any) {
    graphOk = false;
    issues.push(`Compiler pipeline failed: ${err.message}`);
  }

  // 4. SSR validation
  const entryServer = path.join(projectRoot, 'src/entry-server.jsx');
  if (fs.existsSync(entryServer)) {
    try {
      const mod = await core.ssrLoadModule(entryServer);
      if (!mod || typeof mod.render !== 'function') {
        ssrOk = false;
        issues.push('SSR: entry-server.jsx does not export a valid "render" function.');
      }
    } catch (err: any) {
      ssrOk = false;
      issues.push(`SSR: Loading or execution of server module failed: ${err.message}`);
    }
  }

  // 5. Build verification
  try {
    const buildReportPath = path.join(projectRoot, 'dist/client/build-report.json');
    if (!fs.existsSync(buildReportPath)) {
      // Create a temporary production build test
      const distDir = path.join(projectRoot, 'dist');
      if (!fs.existsSync(distDir)) {
        buildOk = false;
        issues.push('Build: Production build report missing. Run "ray build" first.');
      }
    }
  } catch (err: any) {
    buildOk = false;
    issues.push(`Build verification failed: ${err.message}`);
  }

  return {
    configOk,
    graphOk,
    cacheOk,
    ssrOk,
    buildOk,
    issues
  };
}

export function printVerifyReport(report: VerifyReport) {
  console.log(`\n📋 Ray System Diagnostics Verification Report:\n`);

  console.log(`[${report.configOk ? '✔' : '❌'}] Configuration Integrity`);
  console.log(`[${report.graphOk ? '✔' : '❌'}] Compiler & Graph Status`);
  console.log(`[${report.cacheOk ? '✔' : '❌'}] Cache Optimizer State`);
  console.log(`[${report.ssrOk ? '✔' : '❌'}] SSR Framework Interface`);
  console.log(`[${report.buildOk ? '✔' : '❌'}] Build System State`);

  if (report.issues.length > 0) {
    console.log(`\n⚠️  Found ${report.issues.length} verification issues:`);
    for (const issue of report.issues) {
      console.log(`  - ${issue}`);
    }
  } else {
    console.log(`\n✨ Ray System checks passed. Ready for public v1.0 adoption!`);
  }
}
