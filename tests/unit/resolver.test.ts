import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { parseSpecifier, resolveConditionalExports, Resolver } from '../../packages/core/src/resolver/index.js';

describe('Resolver Unit Tests', () => {
  describe('parseSpecifier', () => {
    it('should parse simple packages', () => {
      expect(parseSpecifier('react')).toEqual({ packageName: 'react', subpath: '.' });
      expect(parseSpecifier('react-dom/client')).toEqual({ packageName: 'react-dom', subpath: './client' });
    });

    it('should parse scoped packages', () => {
      expect(parseSpecifier('@babel/core')).toEqual({ packageName: '@babel/core', subpath: '.' });
      expect(parseSpecifier('@babel/core/preset')).toEqual({ packageName: '@babel/core', subpath: './preset' });
    });
  });

  describe('resolveConditionalExports', () => {
    it('should resolve direct strings', () => {
      expect(resolveConditionalExports('./dist/index.js')).toBe('./dist/index.js');
    });

    it('should resolve nested conditions correctly', () => {
      const exportsObj = {
        import: './dist/esm.js',
        require: './dist/cjs.js',
      };
      expect(resolveConditionalExports(exportsObj)).toBe('./dist/esm.js');

      const fallbackObj = {
        browser: {
          import: './dist/browser-esm.js',
        },
      };
      expect(resolveConditionalExports(fallbackObj)).toBe('./dist/browser-esm.js');
    });

    it('should return null when conditions cannot be matched', () => {
      expect(resolveConditionalExports({ unknown: './dist/unknown.js' })).toBeNull();
    });
  });

  describe('Resolver.resolveBarePackage', () => {
    const mockProjectDir = path.resolve(process.cwd(), 'tests/fixtures/mock-project');

    it('should resolve bare package from node_modules', () => {
      const resolver = new Resolver(mockProjectDir);
      const reactPath = resolver.resolveBarePackage('react', mockProjectDir).replace(/\\/g, '/');
      expect(reactPath).toContain('node_modules/react');
      expect(fs.existsSync(reactPath)).toBe(true);
    });

    it('should respect custom conditional exports in packages', () => {
      const resolver = new Resolver(mockProjectDir);
      const customPkg = resolver.resolveBarePackage('custom-pkg', mockProjectDir).replace(/\\/g, '/');
      expect(customPkg).toContain('node_modules/custom-pkg/dist/esm.js');
    });

    it('should resolve subpaths with wildcards', () => {
      const resolver = new Resolver(mockProjectDir);
      const subpathPkg = resolver.resolveBarePackage('custom-pkg/sub/foo', mockProjectDir).replace(/\\/g, '/');
      expect(subpathPkg).toContain('node_modules/custom-pkg/dist/sub/foo.js');
    });

    it('should resolve extension-less subpath imports', () => {
      const resolver = new Resolver(mockProjectDir);
      const resolved = resolver.resolveBarePackage('custom-pkg/dist/sub/foo', mockProjectDir).replace(/\\/g, '/');
      expect(resolved).toContain('node_modules/custom-pkg/dist/sub/foo.js');
    });

    it('should resolve directory imports to index.js fallback', () => {
      const resolver = new Resolver(mockProjectDir);
      const resolved = resolver.resolveBarePackage('custom-pkg/dist/sub', mockProjectDir).replace(/\\/g, '/');
      expect(resolved).toContain('node_modules/custom-pkg/dist/sub/index.js');
    });

    it('should resolve directory imports to package.json main/module field', () => {
      const resolver = new Resolver(mockProjectDir);
      const resolved = resolver.resolveBarePackage('custom-pkg/dist/sub-pkg', mockProjectDir).replace(/\\/g, '/');
      expect(resolved).toContain('node_modules/custom-pkg/dist/sub-pkg/custom-entry.js');
    });

    it('should parse complex nested scoped subpath', () => {
      expect(parseSpecifier('@babel/core/preset/sub')).toEqual({ packageName: '@babel/core', subpath: './preset/sub' });
    });

    it('should fallback to main or module field when exports not present', () => {
      const resolver = new Resolver(mockProjectDir);
      // Create a mock package without exports
      const nodeModules = path.join(mockProjectDir, 'node_modules');
      fs.mkdirSync(path.join(nodeModules, 'legacy-pkg'), { recursive: true });
      fs.writeFileSync(
        path.join(nodeModules, 'legacy-pkg/package.json'),
        JSON.stringify({ name: 'legacy-pkg', version: '1.0.0', main: './main.js' })
      );
      fs.writeFileSync(path.join(nodeModules, 'legacy-pkg/main.js'), 'export const legacy = true;');

      const resolved = resolver.resolveBarePackage('legacy-pkg', mockProjectDir).replace(/\\/g, '/');
      expect(resolved).toContain('node_modules/legacy-pkg/main.js');
    });

    it('should throw an error for non-existent file path resolution', () => {
      const resolver = new Resolver(mockProjectDir);
      expect(() => resolver.resolveBarePackage('custom-pkg/dist/doesnotexist', mockProjectDir)).toThrow();
    });

    it('should throw an error for missing packages', () => {
      const resolver = new Resolver(mockProjectDir);
      expect(() => resolver.resolveBarePackage('missing-package-abc', mockProjectDir)).toThrow();
    });
  });
});
