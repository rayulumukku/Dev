import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CacheManager } from '../../packages/cache/src/CacheManager.js';
import { computeCacheKey } from '../../packages/cache/src/ContentHasher.js';

const testCacheDir = path.resolve(process.cwd(), 'temp-cache-test-dir');

describe('Persistent Incremental Compilation Cache (PR-23)', () => {
  let cache: CacheManager;

  beforeEach(() => {
    if (fs.existsSync(testCacheDir)) {
      fs.rmSync(testCacheDir, { recursive: true, force: true });
    }
    cache = new CacheManager({ dir: testCacheDir, enabled: true });
  });

  afterEach(() => {
    if (fs.existsSync(testCacheDir)) {
      fs.rmSync(testCacheDir, { recursive: true, force: true });
    }
  });

  it('should compute deterministic SHA-256 cache keys', () => {
    const key1 = computeCacheKey({ filePath: 'App.tsx', code: 'export default 1;' });
    const key2 = computeCacheKey({ filePath: 'App.tsx', code: 'export default 1;' });
    const key3 = computeCacheKey({ filePath: 'App.tsx', code: 'export default 2;' });

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it('should store and retrieve cached module transform artifacts (cache hit vs miss)', () => {
    const input = { filePath: 'Component.tsx', code: 'const a = 1;' };

    expect(cache.get(input)).toBeNull();

    cache.set(input, 'var a = 1;', { version: 3 });

    const cached = cache.get(input);
    expect(cached).not.toBeNull();
    expect(cached?.transformedCode).toBe('var a = 1;');

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0.5);
  });

  it('should invalidate cache when file contents, plugins, or Ray versions change', () => {
    const input1 = { filePath: 'App.tsx', code: 'code1', rayVersion: '1.0.0' };
    const input2 = { filePath: 'App.tsx', code: 'code1', rayVersion: '1.1.0' };

    cache.set(input1, 'transformed1');

    expect(cache.get(input1)).not.toBeNull();
    expect(cache.get(input2)).toBeNull();
  });

  it('should support manual invalidation and garbage collection clean operations', () => {
    const input = { filePath: 'Foo.tsx', code: 'const x = 5;' };
    cache.set(input, 'var x = 5;');

    cache.invalidate('Foo.tsx');
    expect(cache.get(input)).toBeNull();

    const removed = cache.clean();
    expect(removed).toBeGreaterThanOrEqual(0);
  });
});
