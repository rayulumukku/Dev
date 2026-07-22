import fs from 'fs';
import path from 'path';

export function validateViteSetup(workspaceDir: string): boolean {
  return fs.existsSync(path.join(workspaceDir, 'vite.config.ts'));
}
