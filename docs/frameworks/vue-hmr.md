# State-Preserving Vue HMR (`@ray/plugin-vue`)

Ray provides fast, state-preserving Hot Module Replacement (HMR) for Vue 3 Single File Components (`.vue`).

## Update Classification Lifecycle

When a `.vue` file changes, Ray's Vue plugin parses the new SFC descriptor and compares SHA hashes against the cached descriptor:

```
                      SFC Changed
                           ↓
                Descriptor Hash Check
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
  Template-only        Style-only         Script / Multiple
        ↓                  ↓                  ↓
Re-render template   Reload CSS tags    Reload JS module
 (Preserve State)   (Zero JS reload)   (Fallback reload)
```

## State Preservation Rules

- **Template Updates**: Re-evaluates component templates while preserving reactive `ref()`s, `reactive()` state, and instance properties.
- **Style Updates**: Directly replaces style elements in the document head without re-executing component JavaScript.
- **Script Updates**: Attempts module HMR reload. If exports or setup logic have structural changes, triggers clean module reload.

## Integration with Ray Core

Vue HMR is built entirely inside `@ray/plugin-vue` and hooks into standard `import.meta.hot.accept`. Zero Vue-specific logic is placed inside Ray core packages.
