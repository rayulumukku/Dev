import fs from 'fs';

export function resolveRealPath(filePath: string): string {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return filePath;
  }
}
