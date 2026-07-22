import { RemoteCacheArtifact, RemoteCacheConfig, RemoteCacheStats } from './types.js';
import { CacheClient } from './CacheClient.js';
import { UploadQueue } from './UploadQueue.js';
import { DownloadQueue } from './DownloadQueue.js';

export class RemoteCacheManager {
  private client: CacheClient;
  private uploadQueue = new UploadQueue();
  private downloadQueue = new DownloadQueue();
  private stats: RemoteCacheStats = {
    localHits: 0,
    remoteHits: 0,
    misses: 0,
    uploads: 0,
    downloads: 0,
    transferredBytes: 0,
    hitRate: 0,
  };

  constructor(config: RemoteCacheConfig) {
    this.client = new CacheClient(config);
  }

  async get(hash: string): Promise<RemoteCacheArtifact | null> {
    const artifact = await this.downloadQueue.fetch(() => this.client.pull(hash));
    if (artifact) {
      this.stats.remoteHits++;
      this.stats.downloads++;
      this.stats.transferredBytes += Buffer.byteLength(JSON.stringify(artifact));
      this.updateHitRate();
      return artifact;
    } else {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  set(artifact: RemoteCacheArtifact): void {
    const payloadSize = Buffer.byteLength(JSON.stringify(artifact));
    this.uploadQueue.add(async () => {
      const ok = await this.client.push(artifact);
      if (ok) {
        this.stats.uploads++;
        this.stats.transferredBytes += payloadSize;
      }
    });
  }

  recordLocalHit(): void {
    this.stats.localHits++;
    this.updateHitRate();
  }

  getStats(): RemoteCacheStats {
    return { ...this.stats };
  }

  private updateHitRate(): void {
    const totalHits = this.stats.localHits + this.stats.remoteHits;
    const totalRequests = totalHits + this.stats.misses;
    this.stats.hitRate = totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) / 100 : 0;
  }
}
