import fs from 'fs';
import path from 'path';

export function writeManifest(outDir, manifestData) {
  fs.mkdirSync(outDir, { recursive: true });
  const manifestPath = path.join(outDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
}
