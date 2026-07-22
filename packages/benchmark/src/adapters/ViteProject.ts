import fs from 'fs';
import path from 'path';

export function setupViteProject(workspaceDir: string): void {
  const viteConfigPath = path.join(workspaceDir, 'vite.config.ts');
  const viteConfigContent = `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});\n`;

  fs.writeFileSync(viteConfigPath, viteConfigContent);

  const pkgPath = path.join(workspaceDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts.build = 'vite build';
    pkg.scripts.dev = 'vite';
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }
}
