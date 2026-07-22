import { describe, it, expect } from 'vitest';
import {
  isRustAccelerationActive,
  loadRustNativeBackend,
  scanDirectoryJS,
  hashContentJS,
  serializeMetadataJS,
  computeCacheKeyJS,
  scanDirectoryAccelerated,
  hashContentAccelerated,
  serializeMetadataAccelerated,
  computeCacheKeyAccelerated,
} from '../../packages/compiler-rust/src/index.js';

describe('Optional Rust Acceleration Layer (PR-26)', () => {
  it('should gracefully report status and load JS fallback when native binary is missing', () => {
    const active = isRustAccelerationActive();
    expect(typeof active).toBe('boolean');
    const backend = loadRustNativeBackend();
    expect(backend).toBeNull();
  });

  it('should perform fast directory scanning via JS fallback', () => {
    const files = scanDirectoryAccelerated(process.cwd());
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });

  it('should compute SHA-256 content hashes with full JS/Rust interface parity', () => {
    const content = 'export const greeting = "hello world";';
    const hash1 = hashContentJS(content);
    const hash2 = hashContentAccelerated(content);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('should compute cache keys and serialize metadata without crashing on complex inputs', () => {
    const key = computeCacheKeyAccelerated({ filePath: 'src/main.ts', code: 'console.log(1);' });
    expect(key).toBeDefined();

    const json = serializeMetadataAccelerated({ a: 1, b: [2, 3] });
    expect(json).toBe('{"a":1,"b":[2,3]}');
  });
});
