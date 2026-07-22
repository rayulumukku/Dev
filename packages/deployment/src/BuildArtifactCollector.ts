import fs from 'fs';
import path from 'path';

export class BuildArtifactCollector {
  static collectArtifacts(outDir: string): { assets: string[]; staticFiles: string[]; serverBundles: string[] } {
    const assets: string[] = [];
    const staticFiles: string[] = [];
    const serverBundles: string[] = [];

    const scan = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file === 'node_modules' || file === 'dist' || file.startsWith('.') || file.startsWith('temp-')) continue;
          const full = path.join(dir, file);
          if (!fs.existsSync(full)) continue;
          const stat = fs.statSync(full);
          const rel = path.relative(outDir, full);
          if (stat.isDirectory()) {
            scan(full);
          } else {
            if (rel.startsWith('assets') || file.endsWith('.png') || file.endsWith('.svg')) {
              assets.push(rel);
            } else if (file.endsWith('.html') || file.endsWith('.json')) {
              staticFiles.push(rel);
            } else if (file.endsWith('.js')) {
              serverBundles.push(rel);
            }
          }
        }
      } catch {
        // Safe catch for concurrently removed directories
      }
    };

    scan(outDir);
    return { assets, staticFiles, serverBundles };
  }
}
