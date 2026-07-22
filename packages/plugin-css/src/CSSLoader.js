import fs from 'fs';

export function loadCSSFile(filename) {
  if (fs.existsSync(filename)) {
    return fs.readFileSync(filename, 'utf-8');
  }
  return '';
}
