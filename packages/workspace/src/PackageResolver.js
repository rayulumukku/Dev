import fs from 'fs';
import path from 'path';

export function resolveWorkspacePackage(specifier, packages) {
  const pkg = packages.get(specifier);
  if (!pkg) return null;

  const candidates = [
    path.join(pkg.location, 'src', 'index.ts'),
    path.join(pkg.location, 'src', 'index.tsx'),
    path.join(pkg.location, 'src', 'index.js'),
    path.join(pkg.location, 'index.ts'),
    path.join(pkg.location, 'index.js'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  return pkg.location;
}
