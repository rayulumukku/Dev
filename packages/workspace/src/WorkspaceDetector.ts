import fs from 'fs';
import path from 'path';
import { WorkspaceManagerType } from './types.js';

export function detectWorkspaceManager(dir: string): { manager: WorkspaceManagerType; root: string } {
  let curr = path.resolve(dir);

  while (curr) {
    if (fs.existsSync(path.join(curr, 'pnpm-workspace.yaml'))) {
      return { manager: 'pnpm', root: curr };
    }

    const pkgPath = path.join(curr, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (pkg.workspaces) {
          if (fs.existsSync(path.join(curr, 'bun.lockb')) || fs.existsSync(path.join(curr, 'bun.lock'))) {
            return { manager: 'bun', root: curr };
          }
          if (fs.existsSync(path.join(curr, 'yarn.lock'))) {
            return { manager: 'yarn', root: curr };
          }
          return { manager: 'npm', root: curr };
        }
      } catch {
        // ignore
      }
    }

    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }

  return { manager: 'none', root: dir };
}
