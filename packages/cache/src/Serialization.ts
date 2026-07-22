import { CacheEntry } from './types.js';

export function serializeEntry(entry: CacheEntry): string {
  return JSON.stringify(entry);
}

export function deserializeEntry(raw: string): CacheEntry {
  return JSON.parse(raw);
}
