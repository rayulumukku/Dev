# Ray Native Plugin Architecture (`@ray/core/plugins`)

This directory implements Ray's native, extensible plugin architecture. It provides a unified lifecycle hook model that powers all Ray subsystems (transformation, module resolution, module loading, dev-server, and production bundler).

## Lifecycle Hooks (Initial Core Set)

- `resolveId(id, importer)`: Intercepts module specifiers during resolution before falling back to the standard resolver.
- `load(id)`: Intercepts module loading by returning custom content before reading from the file system.
- `transform(code, id)`: Transforms module source code sequentially prior to final compilation.

## Plugin Execution & Ordering

Plugins are executed in three deterministic stages according to their `enforce` property:

```
[ enforce: 'pre' plugins ] → [ Normal plugins ] → [ enforce: 'post' plugins ]
```

Registration order within each enforce category is strictly preserved.

## Guarantees

- **Async Resolution**: Sync and Async plugin hooks are supported seamlessly.
- **Error Propagation**: Plugin exceptions bubble up with explicit plugin name labels (`[Plugin: <name>] <hook> error: ...`).
- **Context Isolation**: Plugins access a minimal, safe `PluginContext` exposing `root`, `command`, `mode`, `resolve()`, `warn()`, and `error()`.

## Future Hook Roadmap

The following lifecycle hooks are planned for future PR phases:
- `configureServer`
- `buildStart`
- `buildEnd`
- `generateBundle`
- `writeBundle`
- `watchChange`
- `configurePreview`
