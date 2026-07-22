import fs from 'fs';
import path from 'path';

export class TestDiscovery {
  static discoverTests(root: string): string[] {
    const testFiles: string[] = [];

    const scan = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === 'node_modules' || file === 'dist' || file.startsWith('.')) continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (file.endsWith('.test.ts') || file.endsWith('.test.js') || file.endsWith('.spec.ts') || file.endsWith('.spec.js')) {
          testFiles.push(fullPath);
        }
      }
    };

    scan(root);
    return testFiles;
  }
}
