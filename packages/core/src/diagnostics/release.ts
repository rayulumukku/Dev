import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ReleaseOptions {
  version: string; // 'patch', 'minor', 'major', or exact version string
  dryRun?: boolean;
  skipPerf?: boolean;
}

export async function runRelease(projectRoot: string, options: ReleaseOptions) {
  console.log(`\n🚀 [Ray Release] Starting v1.0 Release Pipeline...`);
  const dryRun = !!options.dryRun;

  if (dryRun) {
    console.log(`⚠️  [Dry Run Mode] No files will be modified on disk or committed.`);
  }

  // 1.0.1 API Compatibility Check
  console.log(`\n🔒 [Ray Release] Verifying API backward compatibility...`);
  const coreExports = await import('../index.js');
  const REQUIRED_EXPORTS = [
    'Resolver',
    'DependencyGraph',
    'ModuleNode',
    'buildProject',
    'PluginContainer',
    'runOptimizer',
    'react',
    'svg',
    'mdx',
    'wasm',
    'json',
    'copy',
    'vue',
    'solid',
    'svelte',
    'tailwind',
    'eslint',
    'pwa',
    'image',
    'runDoctor',
    'displayStats',
    'runBenchmark',
    'runRelease',
    'runVerify',
    'studio',
    'CompilerCacheStore',
    'BuildScheduler',
    'RayCompiler',
    'RayCore'
  ];
  for (const exp of REQUIRED_EXPORTS) {
    if ((coreExports as any)[exp] === undefined) {
      throw new Error(`[Ray Release API Compatibility Check Failed] Missing required public export symbol: "${exp}"`);
    }
  }
  console.log(`✨ [Ray Release] API backward compatibility verified. All ${REQUIRED_EXPORTS.length} public symbols are intact.`);

  // 1.0.2 Memory Leak Diagnostics
  console.log(`\n🧠 [Ray Release] Running memory leak diagnostics...`);
  const initialHeap = process.memoryUsage().heapUsed;
  const { RayCore } = await import('../index.js');
  const coreInstance = new RayCore(projectRoot);
  await coreInstance.init();
  for (let i = 0; i < 50; i++) {
    await coreInstance.transform("const a = 1;", "dummy.js");
  }
  const finalHeap = process.memoryUsage().heapUsed;
  const heapDeltaMB = (finalHeap - initialHeap) / (1024 * 1024);
  console.log(`  > Memory leak test heap delta: ${heapDeltaMB.toFixed(2)} MB`);
  if (heapDeltaMB > 25) {
    throw new Error(`[Ray Release Memory Leak Check Failed] Potential memory leak detected. Heap grew by ${heapDeltaMB.toFixed(2)} MB during compile loop.`);
  }
  console.log(`✨ [Ray Release] Memory usage is stable.`);

  // 1.0.3 Build Snapshot Validation
  console.log(`\n📸 [Ray Release] Running production build snapshot validation...`);
  const demoDir = path.join(projectRoot, 'demo');
  if (fs.existsSync(demoDir)) {
    const { buildProject } = await import('../build/index.js');
    await buildProject({
      outDir: path.join(demoDir, 'dist'),
      minify: true,
      sourcemap: false,
      watch: false,
      analyze: false,
      mode: 'production'
    });
    const buildIndexHtml = path.join(demoDir, 'dist/index.html');
    if (!fs.existsSync(buildIndexHtml)) {
      throw new Error(`[Ray Release Snapshot Check Failed] Production HTML bundle index.html was not generated.`);
    }
    console.log(`✨ [Ray Release] Build snapshot validated successfully.`);
  }

  // 1.0.4 CI Regression Tests Triggers
  if (process.env.VITEST !== 'true' && !process.env.RAY_RELEASE_SKIP_CI) {
    console.log(`\n✅ [Ray Release] Executing unit and integration regression test suite (Vitest)...`);
    try {
      execSync('npx vitest run', { cwd: projectRoot, stdio: 'inherit' });
      console.log(`✨ [Ray Release] Regression unit and integration tests passed.`);
    } catch (err: any) {
      throw new Error(`[Ray Release Regression Check Failed] Unit or integration tests failed: ${err.message}`);
    }

    console.log(`\n✅ [Ray Release] Executing E2E browser regression test suite (Playwright)...`);
    try {
      execSync('npx playwright test', { cwd: projectRoot, stdio: 'inherit' });
      console.log(`✨ [Ray Release] E2E browser integration tests passed.`);
    } catch (err: any) {
      throw new Error(`[Ray Release Regression Check Failed] E2E browser integration tests failed: ${err.message}`);
    }
  }

  // 1.1 Performance Verification Check
  if (!options.skipPerf) {
    console.log(`\n⏱️  [Ray Release] Measuring release performance metrics...`);
    const { measurePerformance, comparePerformance } = await import('../benchmark/index.js');
    const currentMetrics = await measurePerformance(projectRoot);

    const baselinePath = path.join(projectRoot, 'performance-baseline.json');
    let baseline: any = null;

    if (fs.existsSync(baselinePath)) {
      try {
        baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));
      } catch (err: any) {
        console.warn(`⚠️  Failed to parse performance-baseline.json: ${err.message}`);
      }
    }

    if (!baseline) {
      // Try fallback to last tag via git checkout
      try {
        const lastTag = execSync('git describe --tags --abbrev=0', { cwd: projectRoot, encoding: 'utf-8' }).trim();
        if (lastTag) {
          console.log(`⏱️  Previous tag "${lastTag}" found. Checking out temporarily to establish performance baseline...`);
          execSync('git stash', { cwd: projectRoot });
          execSync(`git checkout ${lastTag}`, { cwd: projectRoot });
          try {
            baseline = await measurePerformance(projectRoot);
          } finally {
            execSync('git checkout -', { cwd: projectRoot });
            try {
              execSync('git stash pop', { cwd: projectRoot });
            } catch {}
          }
        }
      } catch {}
    }

    if (baseline) {
      console.log(`\n📊 [Ray Release] Comparing current performance against baseline...`);
      const comparison = comparePerformance(baseline, currentMetrics);
      console.log(comparison.report);

      if (comparison.regressed) {
        throw new Error(`[Ray Release Performance Check Failed] Blocked due to performance regressions: ${comparison.regressedMetrics.join(', ')}`);
      }
      if (!comparison.improved) {
        throw new Error(`[Ray Release Performance Check Failed] Blocked: Every release must improve at least one performance metric. No improvements detected.`);
      }

      console.log(`\n✨ [Ray Release] Performance check passed! Current release is faster / more efficient.`);
    } else {
      console.log(`⚠️  [Ray Release] No previous performance baseline found. Initial baseline will be saved.`);
    }

    if (!dryRun) {
      fs.writeFileSync(baselinePath, JSON.stringify(currentMetrics, null, 2) + '\n');
      console.log(`📝 Saved updated performance baseline to: ${baselinePath}`);
    }
  }

  // 1. Resolve current & target versions
  const rootPkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(rootPkgPath)) {
    throw new Error(`Could not find root package.json at: ${rootPkgPath}`);
  }

  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
  const currentVersion = rootPkg.version || '0.0.0';
  let targetVersion = options.version;

  if (['patch', 'minor', 'major'].includes(options.version)) {
    const parts = currentVersion.split('.').map((p: string) => parseInt(p, 10));
    if (options.version === 'major') {
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
    } else if (options.version === 'minor') {
      parts[1] += 1;
      parts[2] = 0;
    } else {
      parts[2] += 1;
    }
    targetVersion = parts.join('.');
  }

  console.log(`  > Current version: ${currentVersion}`);
  console.log(`  > Target version:  ${targetVersion}`);

  // 2. Locate all workspace packages
  const packageFolders = [
    '.',
    'packages/cli',
    'packages/core',
    'packages/dev-server',
    'packages/hmr-runtime',
    'packages/transform',
    'demo',
    'demo-lib'
  ];

  const packagesToUpdate = packageFolders
    .map(folder => path.join(projectRoot, folder))
    .filter(dir => fs.existsSync(path.join(dir, 'package.json')));

  // 3. Update versions in package.json files
  console.log(`\n📦 Bumping versions in workspace package.json files...`);
  for (const pkgDir of packagesToUpdate) {
    const pkgJsonPath = path.join(pkgDir, 'package.json');
    const pkgContent = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
    
    const originalVersion = pkgContent.version;
    pkgContent.version = targetVersion;

    // Update dependencies matching @ray/* to targetVersion
    const depFields = ['dependencies', 'devDependencies', 'peerDependencies'];
    for (const field of depFields) {
      if (pkgContent[field]) {
        for (const depName of Object.keys(pkgContent[field])) {
          if (depName.startsWith('@ray/') && pkgContent[field][depName] !== '*') {
            pkgContent[field][depName] = `^${targetVersion}`;
          }
        }
      }
    }

    const relativePath = path.relative(projectRoot, pkgJsonPath);
    console.log(`  - Update ${relativePath}: ${originalVersion || 'none'} -> ${targetVersion}`);
    
    if (!dryRun) {
      fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgContent, null, 2) + '\n');
    }
  }

  // 4. Generate CHANGELOG.md entries
  console.log(`\n📝 Generating changelog update...`);
  let gitLogs = 'Initial release candidate.';
  try {
    gitLogs = execSync('git log --oneline -n 15', { encoding: 'utf-8' });
  } catch (err) {
    // Ignore git error
  }

  const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
  const changelogEntry = `## [${targetVersion}] - ${new Date().toISOString().split('T')[0]}\n\n### Changes\n${gitLogs.split('\n').map(line => `* ${line}`).join('\n')}\n\n`;

  console.log(`  > Generated changelog entry size: ${changelogEntry.length} characters.`);
  if (!dryRun) {
    let existingContent = '';
    if (fs.existsSync(changelogPath)) {
      existingContent = fs.readFileSync(changelogPath, 'utf-8');
    }
    fs.writeFileSync(changelogPath, changelogEntry + existingContent);
    console.log(`  > Updated: CHANGELOG.md`);
  }

  // 5. Git commit, tag & simulated publish
  if (!dryRun) {
    try {
      console.log(`\n💾 Committing changes and tag release...`);
      execSync('git add .', { cwd: projectRoot });
      execSync(`git commit -m "chore(release): bump v${targetVersion}"`, { cwd: projectRoot });
      execSync(`git tag -a v${targetVersion} -m "Release v${targetVersion}"`, { cwd: projectRoot });
      console.log(`  > Git commit and tag (v${targetVersion}) registered successfully.`);
    } catch (err: any) {
      console.warn(`  > Git operations skipped/failed: ${err.message}`);
    }
  }

  console.log(`\n🎉 Release pipeline completed successfully for v${targetVersion}!`);
}
