import crypto from 'crypto';
import { CacheKeyInput } from './types.js';

export function computeCacheKey(input: CacheKeyInput): string {
  const hasher = crypto.createHash('sha256');
  hasher.update(input.filePath);
  hasher.update(input.code);
  hasher.update(input.rayVersion || '1.0.0');
  hasher.update(input.buildMode || 'development');

  if (input.pluginConfig) {
    hasher.update(JSON.stringify(input.pluginConfig));
  }

  if (input.env) {
    hasher.update(JSON.stringify(input.env));
  }

  if (input.dependencies) {
    hasher.update(input.dependencies.join(','));
  }

  return hasher.digest('hex');
}
