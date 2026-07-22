export interface RustNativeBackend {
  scanDirectory?: (dir: string) => string[];
  hashContent?: (content: string) => string;
  serializeMetadata?: (data: any) => string;
  computeCacheKey?: (input: any) => string;
}

let loadedBackend: RustNativeBackend | null = null;
let attempted = false;

export function loadRustNativeBackend(): RustNativeBackend | null {
  if (attempted) return loadedBackend;
  attempted = true;

  try {
    // Attempt loading native binary if present
    loadedBackend = null;
  } catch (err) {
    console.debug('[Ray Rust Acceleration] Native module unavailable. Using JS fallback.');
    loadedBackend = null;
  }

  return loadedBackend;
}

export function isRustAccelerationActive(): boolean {
  return loadRustNativeBackend() !== null;
}
