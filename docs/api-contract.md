# Public API Stability & Compatibility Framework (`@ray/api-contract`)

The `@ray/api-contract` package defines, validates, and enforces the public API surface across all Ray packages, distinguishing public, experimental, deprecated, and internal APIs while detecting breaking changes.

## Stability Levels

1. **`public`**: Backed by semantic versioning compatibility guarantees (`patch-safe`, `minor-safe`).
2. **`experimental`**: Opt-in features under active iteration (`@experimental`).
3. **`deprecated`**: Scheduled for removal in a future major version (`@deprecated`). Includes replacement guidance.
4. **`internal`**: Unexported or internal implementation details (`@internal`).

## CLI Usage

```bash
# Scan public export surface of a package
ray api scan

# Compute API compatibility diff against baseline
ray api diff

# Validate API contract guarantees
ray api validate

# Generate Markdown API reference documentation
ray api docs
```

## Deprecation Policy

When deprecating a public API:
1. Annotate symbol with `@deprecated` tag and provide replacement guidance.
2. Register deprecation notice in `DeprecationManager`.
3. Schedule removal for the next major version release.
