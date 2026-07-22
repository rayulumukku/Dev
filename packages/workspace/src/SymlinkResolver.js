import fs from 'fs';

export function resolveRealPath(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return filePath;
  }
}
