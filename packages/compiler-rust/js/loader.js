let loadedBackend = null;
let attempted = false;
export function loadRustNativeBackend() {
    if (attempted)
        return loadedBackend;
    attempted = true;
    try {
        // Attempt loading native binary if present
        loadedBackend = null;
    }
    catch (err) {
        console.debug('[Ray Rust Acceleration] Native module unavailable. Using JS fallback.');
        loadedBackend = null;
    }
    return loadedBackend;
}
export function isRustAccelerationActive() {
    return loadRustNativeBackend() !== null;
}
//# sourceMappingURL=loader.js.map