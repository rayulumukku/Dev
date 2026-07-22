import { loadRustNativeBackend } from './loader.js';
import { scanDirectoryJS, hashContentJS, serializeMetadataJS, computeCacheKeyJS } from './fallback.js';

export function scanDirectoryAccelerated(dir: string): string[] {
  const native = loadRustNativeBackend();
  if (native?.scanDirectory) {
    try {
      return native.scanDirectory(dir);
    } catch {
      // fallback
    }
  }
  return scanDirectoryJS(dir);
}

export function hashContentAccelerated(content: string): string {
  const native = loadRustNativeBackend();
  if (native?.hashContent) {
    try {
      return native.hashContent(content);
    } catch {
      // fallback
    }
  }
  return hashContentJS(content);
}

export function serializeMetadataAccelerated(data: any): string {
  const native = loadRustNativeBackend();
  if (native?.serializeMetadata) {
    try {
      return native.serializeMetadata(data);
    } catch {
      // fallback
    }
  }
  return serializeMetadataJS(data);
}

export function computeCacheKeyAccelerated(input: { filePath: string; code: string; version?: string }): string {
  const native = loadRustNativeBackend();
  if (native?.computeCacheKey) {
    try {
      return native.computeCacheKey(input);
    } catch {
      // fallback
    }
  }
  return computeCacheKeyJS(input);
}
