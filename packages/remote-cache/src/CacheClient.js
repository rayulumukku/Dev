import { requestHTTP } from './CacheProtocol.js';
import { getQualifiedCacheKey } from './Manifest.js';

export class CacheClient {
  constructor(config) {
    this.config = config;
  }

  async exists(hash) {
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

  async pull(hash) {
    if (!this.config.enabled || !this.config.url) return null;
    const key = getQualifiedCacheKey(hash, this.config.namespace);
    const targetUrl = `${this.config.url.replace(/\/$/, '')}/${key}`;
    try {
      const res = await requestHTTP(targetUrl, 'GET', undefined, this.config.token);
      if (res.statusCode === 200) {
        return JSON.parse(res.data);
      }
    } catch {
      // ignore offline errors
    }
    return null;
  }

  async push(artifact) {
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
