import fs from 'fs';
import path from 'path';

export function locateWorkspacePackages(workspaceRoot) {
  const packagesMap = new Map();
  const searchDirs = ['apps', 'packages'];

  for (const dirName of searchDirs) {
    const parentDir = path.join(workspaceRoot, dirName);
    if (fs.existsSync(parentDir)) {
      const entries = fs.readdirSync(parentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pkgPath = path.join(parentDir, entry.name, 'package.json');
          if (fs.existsSync(pkgPath)) {
            try {
              const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
              if (pkg.name) {
                const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
                packagesMap.set(pkg.name, {
                  name: pkg.name,
                  version: pkg.version || '1.0.0',
                  location: path.join(parentDir, entry.name),
                  manifestPath: pkgPath,
                  dependencies: deps,
                });
              }
            } catch {
              // ignore
            }
          }
        }
      }
    }
  }

  return packagesMap;
}
