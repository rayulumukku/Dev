import fs from 'fs';
import path from 'path';

/**
 * Parses an import specifier into its package name and subpath.
 * E.g., 'react' -> { packageName: 'react', subpath: '.' }
 * E.g., 'react-dom/client' -> { packageName: 'react-dom', subpath: './client' }
 * E.g., '@babel/core/preset' -> { packageName: '@babel/core', subpath: './preset' }
 */
export function parseSpecifier(specifier: string): { packageName: string; subpath: string } {
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    return {
      packageName: `${parts[0]}/${parts[1]}`,
      subpath: parts.slice(2).join('/') ? './' + parts.slice(2).join('/') : '.',
    };
  } else {
    const parts = specifier.split('/');
    return {
      packageName: parts[0],
      subpath: parts.slice(1).join('/') ? './' + parts.slice(1).join('/') : '.',
    };
  }
}

/**
 * Resolves conditional exports based on client ESM preferences.
 */
export function resolveConditionalExports(exportsValue: any): string | null {
  if (typeof exportsValue === 'string') {
    return exportsValue;
  }
  if (typeof exportsValue === 'object' && exportsValue !== null) {
    const conditions = ['import', 'module', 'browser', 'default', 'require'];
    for (const cond of conditions) {
      if (cond in exportsValue) {
        const val = resolveConditionalExports(exportsValue[cond]);
        if (val) return val;
      }
    }
  }
  return null;
}

export class Resolver {
  projectRoot: string;
  // In-memory cache for bare package resolutions
  resolutionCache = new Map<string, string>();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Resolves a bare package specifier (e.g. 'react', 'react-dom/client') to its absolute file path.
   * Uses standard Node-style node_modules lookup starting from the importer directory.
   */
  resolveBarePackage(specifier: string, startDir: string): string {
    const cacheKey = `${specifier}::${startDir}`;
    if (this.resolutionCache.has(cacheKey)) {
      return this.resolutionCache.get(cacheKey)!;
    }

    const { packageName, subpath } = parseSpecifier(specifier);
    const packageDir = this.findPackageDir(packageName, startDir);
    const packageJsonPath = path.join(packageDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`Could not find package.json for package "${packageName}" at "${packageJsonPath}"`);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    let resolvedRelPath: string | null = null;

    // Respect exports field if present
    if (packageJson.exports) {
      const exportsObj = packageJson.exports;
      if (subpath === '.') {
        if (typeof exportsObj === 'string' || !('.' in exportsObj)) {
          // If it's a direct string or does not map subpaths, resolve the root directly
          resolvedRelPath = resolveConditionalExports(exportsObj);
        } else {
          resolvedRelPath = resolveConditionalExports(exportsObj['.']);
        }
      } else {
        // Look for exact match or wildcard match
        if (subpath in exportsObj) {
          resolvedRelPath = resolveConditionalExports(exportsObj[subpath]);
        } else {
          // Check for wildcards
          for (const key of Object.keys(exportsObj)) {
            if (key.includes('*')) {
              const [prefix, suffix] = key.split('*');
              if (subpath.startsWith(prefix) && subpath.endsWith(suffix || '')) {
                const match = subpath.slice(prefix.length, suffix ? subpath.length - suffix.length : undefined);
                const target = exportsObj[key];
                if (typeof target === 'string') {
                  resolvedRelPath = target.replace('*', match);
                } else {
                  const resolvedTarget = resolveConditionalExports(target);
                  if (resolvedTarget) {
                    resolvedRelPath = resolvedTarget.replace('*', match);
                  }
                }
                break;
              }
            }
          }
        }
      }
    }

    // Fall back to module, browser, then main if exports didn't resolve or aren't present
    if (!resolvedRelPath && subpath === '.') {
      resolvedRelPath = packageJson.module || packageJson.browser || packageJson.main || 'index.js';
    }

    let resolvedAbsolutePath: string;
    if (resolvedRelPath) {
      resolvedAbsolutePath = path.resolve(packageDir, resolvedRelPath);
    } else {
      // Direct file fallback for subpaths if exports not defined
      resolvedAbsolutePath = path.resolve(packageDir, subpath);
    }

    // Resolve extensions and directories
    resolvedAbsolutePath = this.ensureFile(resolvedAbsolutePath);

    this.resolutionCache.set(cacheKey, resolvedAbsolutePath);
    return resolvedAbsolutePath;
  }

  /**
   * Recursively finds node_modules/<packageName> walking up from the start directory.
   */
  private findPackageDir(packageName: string, startDir: string): string {
    let dir = startDir;
    while (true) {
      const candidate = path.join(dir, 'node_modules', packageName);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
      const parent = path.dirname(dir);
      if (parent === dir) {
        throw new Error(`Cannot find node_modules folder for package "${packageName}" starting from "${startDir}"`);
      }
      dir = parent;
    }
  }

  /**
   * Resolves extension-less paths or directories containing index files.
   */
  private ensureFile(filePath: string): string {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }

    const extensions = ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json'];
    for (const ext of extensions) {
      const candidate = filePath + ext;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }

    // Check directory index fallback
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      const indexJson = path.join(filePath, 'package.json');
      if (fs.existsSync(indexJson)) {
        const pkg = JSON.parse(fs.readFileSync(indexJson, 'utf-8'));
        const main = pkg.module || pkg.main || 'index.js';
        return this.ensureFile(path.resolve(filePath, main));
      }

      for (const ext of extensions) {
        const candidate = path.join(filePath, 'index' + ext);
        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
          return candidate;
        }
      }
    }

    throw new Error(`Cannot resolve file path: "${filePath}"`);
  }
}
