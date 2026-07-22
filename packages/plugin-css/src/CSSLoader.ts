import fs from 'fs';

export function loadCSSFile(filename: string): string {
  if (fs.existsSync(filename)) {
    return fs.readFileSync(filename, 'utf-8');
  }
  return '';
}
