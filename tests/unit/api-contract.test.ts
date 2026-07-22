import { describe, it, expect, beforeEach } from 'vitest';
import {
  APIScanner,
  CompatibilityChecker,
  DeprecationManager,
  PublicManifest,
  APIRegistry,
  StabilityLevels,
} from '../../packages/api-contract/src/index.js';

describe('Public API Stability & Compatibility Framework (PR-49)', () => {
  beforeEach(() => {
    APIRegistry.clear();
    DeprecationManager.clear();
  });

  it('1. should scan package exports and assign stability levels', () => {
    const exportsList = ['RayCore', 'defineConfig', '_internalHelper', 'useExperimentalFeature'];
    const manifest = APIScanner.scanPackage('@ray/core', exportsList);

    expect(manifest.symbols.length).toBe(4);
    expect(manifest.symbols.find(s => s.name === 'RayCore')?.stability).toBe('public');
    expect(manifest.symbols.find(s => s.name === '_internalHelper')?.stability).toBe('internal');
    expect(manifest.symbols.find(s => s.name === 'useExperimentalFeature')?.stability).toBe('experimental');
  });

  it('2. should detect signature changes and classify severity', () => {
    const oldManifest = APIScanner.scanPackage('@ray/core', ['RayCore']);
    const newManifest = APIScanner.scanPackage('@ray/core', ['RayCore']);
    newManifest.symbols[0].signature = 'export function RayCore(options: any): void;';

    const diff = CompatibilityChecker.diffManifests(oldManifest, newManifest);
    expect(diff.modified.length).toBe(1);
    expect(diff.modified[0].severity).toBe('major-required');
  });

  it('3. should handle API deprecations with replacement guidance', () => {
    const symbol = { name: 'legacyCompiler', kind: 'function' as const, stability: 'public' as const };
    DeprecationManager.deprecate(symbol, 'useNativeCompiler', '2.0.0');

    const deprecated = DeprecationManager.getDeprecated();
    expect(deprecated.length).toBe(1);
    expect(deprecated[0].symbol.stability).toBe('deprecated');
    expect(deprecated[0].replacement).toBe('useNativeCompiler');
  });

  it('4. should generate Markdown API documentation', () => {
    const manifest = APIScanner.scanPackage('@ray/core', ['RayCore', 'defineConfig']);
    const markdown = PublicManifest.formatMarkdownDocs(manifest);

    expect(markdown).toContain('# Public API Reference: @ray/core');
    expect(markdown).toContain('## `RayCore`');
    expect(markdown).toContain('## `defineConfig`');
  });
});
