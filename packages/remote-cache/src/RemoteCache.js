import { CacheClient } from './CacheClient.js';
import { UploadQueue } from './UploadQueue.js';
import { DownloadQueue } from './DownloadQueue.js';

export class RemoteCacheManager {
  constructor(config) {
    this.client = new CacheClient(config);
    this.uploadQueue = new UploadQueue();
    this.downloadQueue = new DownloadQueue();
    this.stats = {
      localHits: 0,
      remoteHits: 0,
      misses: 0,
      uploads: 0,
      downloads: 0,
      transferredBytes: 0,
      hitRate: 0,
    };
  }

  async get(hash) {
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

  set(artifact) {
    const payloadSize = Buffer.byteLength(JSON.stringify(artifact));
    this.uploadQueue.add(async () => {
      const ok = await this.client.push(artifact);
      if (ok) {
        this.stats.uploads++;
        this.stats.transferredBytes += payloadSize;
      }
    });
  }

  recordLocalHit() {
    this.stats.localHits++;
    this.updateHitRate();
  }

  getStats() {
    return { ...this.stats };
  }

  updateHitRate() {
    const totalHits = this.stats.localHits + this.stats.remoteHits;
    const totalRequests = totalHits + this.stats.misses;
    this.stats.hitRate = totalRequests > 0 ? Math.round((totalHits / totalRequests) * 100) / 100 : 0;
  }
}
