import fs from 'fs';
import path from 'path';

export function validateViteSetup(workspaceDir) {
  return fs.existsSync(path.join(workspaceDir, 'vite.config.ts'));
}
