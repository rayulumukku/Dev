# Persistent Incremental Compilation Cache (`@ray/cache`)

The `@ray/cache` package implements a content-addressed on-disk compilation cache for Ray to eliminate unnecessary recompilation across dev server restarts and production builds.

## Directory Structure

```
node_modules/.cache/ray/
  ├── <sha256-hash-1>.json
  ├── <sha256-hash-2>.json
  └── ...
```

## Cache Keys & Invalidation

Cache keys are calculated deterministically using SHA-256 hashes of:
- File source contents
- Dependency hashes
- Ray compiler version
- Build mode (`development` vs `production`)
- Plugin configuration options and environment variables

Entries are invalidated automatically when any constituent parameter changes.
