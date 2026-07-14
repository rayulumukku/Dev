import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ReleaseOptions {
  version: string; // 'patch', 'minor', 'major', or exact version string
  dryRun?: boolean;
}

export function runRelease(projectRoot: string, options: ReleaseOptions) {
  console.log(`\n🚀 [Ray Release] Starting v1.0 Release Pipeline...`);
  const dryRun = !!options.dryRun;

  if (dryRun) {
    console.log(`⚠️  [Dry Run Mode] No files will be modified on disk or committed.`);
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
