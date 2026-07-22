# Optional Rust Acceleration Layer (`@ray/compiler-rust`)

Ray includes an optional Rust native acceleration layer for CPU-intensive compilation tasks such as fast directory scanning, SHA-256 content hashing, graph serialization, and cache key computation.

## Architecture & Fallback Strategy

When Ray starts:
1. It attempts to load native NAPI-RS binary bindings.
2. If the native binary is missing, corrupt, or incompatible, Ray logs a debug message and seamlessly falls back to canonical JavaScript implementations without crashing or interrupting execution.

## Supported Platforms

- Windows (`x64`, `arm64`)
- macOS (`x64`, `arm64`)
- Linux (`x64`, `arm64`)
