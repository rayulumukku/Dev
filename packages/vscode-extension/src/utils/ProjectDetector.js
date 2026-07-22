import fs from 'fs';
import path from 'path';

export function isRayProject(workspaceDir) {
  if (!fs.existsSync(workspaceDir)) return false;

  const configFiles = ['ray.config.ts', 'ray.config.js', 'ray.config.mjs'];
  for (const file of configFiles) {
    if (fs.existsSync(path.join(workspaceDir, file))) return true;
  }

  const pkgPath = path.join(workspaceDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps['@ray/core'] || deps['@ray/cli']) return true;
    } catch {
      // ignore
    }
  }

  return false;
}
