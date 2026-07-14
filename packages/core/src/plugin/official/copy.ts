import { RayPlugin } from '../index.js';
import fs from 'fs';
import path from 'path';

/**
 * Official Ray plugin for copying static assets during production builds.
 * Recursively mirrors directories like public/ into output build dirs.
 */
export function copyPlugin(): RayPlugin {
  return {
    name: '@ray/plugin-static-copy',

    async generateBundle() {
      const publicDir = path.resolve(this.projectRoot, 'public');
      const outDir = path.resolve(this.projectRoot, 'dist');

      if (fs.existsSync(publicDir)) {
        console.log(`[Ray Copy Plugin] Mirroring static assets from public/ to dist/ ...`);

        const copyFolder = (src: string, dest: string) => {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }

          const files = fs.readdirSync(src);
          for (const file of files) {
            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);
            const stat = fs.statSync(srcPath);

            if (stat.isDirectory()) {
              copyFolder(srcPath, destPath);
            } else {
              fs.copyFileSync(srcPath, destPath);
            }
          }
        };

        copyFolder(publicDir, outDir);
      }
    },
  };
}
