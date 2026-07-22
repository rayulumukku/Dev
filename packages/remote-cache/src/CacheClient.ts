import { RemoteCacheArtifact, RemoteCacheConfig } from './types.js';
import { requestHTTP } from './CacheProtocol.js';
import { getQualifiedCacheKey } from './Manifest.js';

export class CacheClient {
  private config: RemoteCacheConfig;

  constructor(config: RemoteCacheConfig) {
    this.config = config;
  }

  async exists(hash: string): Promise<boolean> {
    if (!this.config.enabled || !this.config.url) return false;
    const key = getQualifiedCacheKey(hash, this.config.namespace);
    const targetUrl = `${this.config.url.replace(/\/$/, '')}/${key}`;
    try {
      const res = await requestHTTP(targetUrl, 'HEAD', undefined, this.config.token);
      return res.statusCode === 200;
    } catch {
      return false;
    }
  }

  async pull(hash: string): Promise<RemoteCacheArtifact | null> {
    if (!this.config.enabled || !this.config.url) return null;
    const key = getQualifiedCacheKey(hash, this.config.namespace);
    const targetUrl = `${this.config.url.replace(/\/$/, '')}/${key}`;
    try {
      const res = await requestHTTP(targetUrl, 'GET', undefined, this.config.token);
      if (res.statusCode === 200) {
        return JSON.parse(res.data) as RemoteCacheArtifact;
      }
    } catch {
      // ignore offline errors
    }
    return null;
  }

  async push(artifact: RemoteCacheArtifact): Promise<boolean> {
    if (!this.config.enabled || !this.config.url) return false;
    const key = getQualifiedCacheKey(artifact.hash, this.config.namespace);
    const targetUrl = `${this.config.url.replace(/\/$/, '')}/${key}`;
    try {
      const res = await requestHTTP(targetUrl, 'PUT', JSON.stringify(artifact), this.config.token);
      return res.statusCode === 200;
    } catch {
      return false;
    }
  }
}
