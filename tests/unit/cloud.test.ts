import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { RayCloudClient } from '../../packages/core/src/diagnostics/cloudClient.js';
import { RayCore } from '../../packages/core/src/index.js';
import { DistributedBuildExecutor } from '../../packages/core/src/build/remoteExecutor.js';

describe('Ray Cloud Distributed Build & Remote Cache Platform Tests', () => {
  const projectRoot = path.resolve(process.cwd(), 'tests/fixtures/cloud-project');
  let client: RayCloudClient;

  beforeAll(() => {
    fs.mkdirSync(projectRoot, { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify({
      name: 'cloud-project',
      version: '1.0.0',
      type: 'module'
    }, null, 2));

    fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'src/main.js'), 'export const a = 1;');
    fs.writeFileSync(path.join(projectRoot, 'src/sub.js'), 'export const b = 2;');

    client = new RayCloudClient(projectRoot);
  });

  afterAll(() => {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  });

  it('should authenticate and store credentials locally', () => {
    client.clearAuth();
    expect(client.getAuth().token).toBeNull();

    client.saveAuth({ token: 'test-token-123', org: 'my-org', project: 'my-project', email: 'dev@my-org.com' });
    const auth = client.getAuth();
    expect(auth.token).toBe('test-token-123');
    expect(auth.org).toBe('my-org');
    expect(auth.project).toBe('my-project');
    expect(auth.email).toBe('dev@my-org.com');

    client.clearAuth();
    expect(client.getAuth().token).toBeNull();
  });

  it('should calculate deterministic CAS key based on project settings', () => {
    const key1 = client.computeCASKey('code1', { mode: 'prod' }, 'lock1', ['1.0.0']);
    const key2 = client.computeCASKey('code1', { mode: 'prod' }, 'lock1', ['1.0.0']);
    const key3 = client.computeCASKey('code2', { mode: 'prod' }, 'lock1', ['1.0.0']);

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1.length).toBe(64);
  });

  it('should sanitize environment variables and drop secrets before sharing metadata', () => {
    const dirtyMetadata = {
      entry: 'main.js',
      config: {
        minify: true,
        envSecret: 'super-secret-password-123',
        stripeKey: 'sk_test_5123456789'
      },
      api_key: 'token-abc'
    };

    const cleanMetadata = client.sanitizeMetadata(dirtyMetadata);
    expect(cleanMetadata.entry).toBe('main.js');
    expect(cleanMetadata.config.envSecret).toBe('[REDACTED_SECRET]');
    expect(cleanMetadata.config.stripeKey).toBe('[REDACTED_SECRET]');
    expect(cleanMetadata.api_key).toBe('[REDACTED_SECRET]');
  });

  it('should support offline synchronization queue mechanism', () => {
    client.saveAuth({ token: 'test-token-123' });
    
    // Set offline mode flag globally
    (globalThis as any).__ray_cloud_offline = true;
    expect(client.isOnline()).toBe(false);

    // Uploading when offline should write to queue
    const uploadSuccess = client.uploadArtifact('my-hash-key', 'transformed-code-xyz');
    expect(uploadSuccess).toBe(false);

    // Restore online mode
    (globalThis as any).__ray_cloud_offline = false;
    expect(client.isOnline()).toBe(true);

    // Sync queue should trigger upload and clear queue
    const syncedCount = client.syncOfflineQueue();
    expect(syncedCount).toBe(1);

    // Fetch matching artifact
    const fetched = client.downloadArtifact('my-hash-key');
    expect(fetched).toBe('transformed-code-xyz');
  });

  it('should run distributed compilation via DistributedBuildExecutor', async () => {
    const ray = new RayCore(projectRoot);
    await ray.init();

    ray.cloudClient.saveAuth({ token: 'test-token-123' });

    const executor = new DistributedBuildExecutor(ray, 4);
    const files = [
      path.join(projectRoot, 'src/main.js'),
      path.join(projectRoot, 'src/sub.js')
    ];

    const res = await executor.runRemoteBuild(files);
    expect(res.totalFiles).toBe(2);
    expect(res.workerCount).toBe(4);
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
    expect(res.cacheHits).toBe(0); // first run has no hits
  });
});
