let loadedBackend = null;
let attempted = false;

export function loadRustNativeBackend() {
  if (attempted) return loadedBackend;
  attempted = true;

  try {
    loadedBackend = null;
  } catch {
    console.debug('[Ray Rust Acceleration] Native module unavailable. Using JS fallback.');
    loadedBackend = null;
  }

  return loadedBackend;
}

export function isRustAccelerationActive() {
  return loadRustNativeBackend() !== null;
}
