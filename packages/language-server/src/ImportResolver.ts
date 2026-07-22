import fs from 'fs';
import path from 'path';

export class ImportResolver {
  private projectRoot: string;
  private aliasMap: Record<string, string>;

  constructor(projectRoot: string, aliasMap: Record<string, string> = {}) {
    this.projectRoot = projectRoot;
    this.aliasMap = { '@': 'src', ...aliasMap };
  }

  resolveImport(importPath: string, importerFile: string): string | null {
    // 1. Path Aliases (e.g., '@/components/Button')
    for (const [prefix, target] of Object.entries(this.aliasMap)) {
      if (importPath.startsWith(prefix)) {
        const rel = importPath.slice(prefix.length).replace(/^\//, '');
        const candidate = path.resolve(this.projectRoot, target, rel);
        const resolved = this.tryExtensions(candidate);
        if (resolved) return resolved;
      }
    }

    // 2. Relative Imports (e.g., './util' or '../App')
    if (importPath.startsWith('.')) {
      const candidate = path.resolve(path.dirname(importerFile), importPath);
      return this.tryExtensions(candidate);
    }

    // 3. Absolute Paths
    if (path.isAbsolute(importPath)) {
      return this.tryExtensions(importPath);
    }

    return null;
  }

  private tryExtensions(candidatePath: string): string | null {
    const exts = ['', '.ts', '.tsx', '.js', '.jsx', '.json', '.vue', '.svelte', '.mdx', '/index.ts', '/index.js'];
    for (const ext of exts) {
      const full = candidatePath + ext;
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        return full;
      }
    }
    return null;
  }
}
