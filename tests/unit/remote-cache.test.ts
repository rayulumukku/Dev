import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheServer } from '../../packages/remote-cache/src/CacheServer.js';
import { RemoteCacheManager } from '../../packages/remote-cache/src/RemoteCache.js';
import { getAuthHeaders } from '../../packages/remote-cache/src/Authentication.js';
import { getQualifiedCacheKey } from '../../packages/remote-cache/src/Manifest.js';

describe('Remote Cache Support (PR-27)', () => {
  let server: CacheServer;
  const port = 3098;
  const serverUrl = `http://localhost:${port}`;

  beforeEach(async () => {
    server = new CacheServer(port);
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should generate Bearer authentication headers correctly', () => {
    expect(getAuthHeaders('secret-token')).toEqual({ Authorization: 'Bearer secret-token' });
    expect(getAuthHeaders('Bearer secret-token')).toEqual({ Authorization: 'Bearer secret-token' });
  });

  it('should qualify cache keys with team namespaces', () => {
    expect(getQualifiedCacheKey('hash123', 'team-a')).toBe('team-a/hash123');
    expect(getQualifiedCacheKey('hash123')).toBe('hash123');
  });

  it('should store, retrieve, and track stats for remote cache artifacts', async () => {
    const remoteCache = new RemoteCacheManager({
      enabled: true,
      url: serverUrl,
      namespace: 'team-a',
    });

    const artifact = {
      hash: 'hash-abc',
      data: 'export const x = 1;',
      timestamp: Date.now(),
    };

    remoteCache.set(artifact);

    // Give upload queue time to process
    await new Promise((r) => setTimeout(r, 100));

    const retrieved = await remoteCache.get('hash-abc');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.data).toBe('export const x = 1;');

    const stats = remoteCache.getStats();
    expect(stats.remoteHits).toBe(1);
    expect(stats.downloads).toBe(1);
    expect(stats.transferredBytes).toBeGreaterThan(0);
  });

  it('should fall back gracefully without failing when remote cache URL is unreachable', async () => {
    const offlineCache = new RemoteCacheManager({
      enabled: true,
      url: 'http://localhost:59999', // invalid port
    });

    const res = await offlineCache.get('missing-hash');
    expect(res).toBeNull();

    const stats = offlineCache.getStats();
    expect(stats.misses).toBe(1);
  });
});
