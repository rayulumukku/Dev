# Ray Transform Pipeline Lifecycle

The Ray Transform Pipeline exposes optional plugin hooks for inspecting, modifying, and post-processing code during compilation.

## Lifecycle Stages & Execution Flow

```
Source Code
    ↓
1. beforeTransform (inspect source, cache metadata, prepare transforms)
    ↓
2. transform (modify source code, return { code, map } or string)
    ↓
3. compiler.compile (core compilation, esbuild & React Export Proxy Pattern)
    ↓
4. afterTransform (inspect/instrument compiled output, attach banners)
    ↓
Compiled Output & Source Maps
```

## Lifecycle Hooks

### `beforeTransform(context: TransformContext)`
- **Timing**: Called before any transformation occurs.
- **Use cases**: Pre-flight analysis, asset tracking, setting up per-file metadata.
- **Context API**: `context.filename`, `context.absolutePath`, `context.extension`, `context.mode`, `context.command`, `context.loader`, `context.isProduction`.

### `transform(code: string, id: string, context?: TransformContext)`
- **Timing**: Sequential code transformation.
- **Return formats**:
  - `null` / `undefined`: Leave code unchanged.
  - `string`: Replace source code.
  - `{ code: string, map?: any }`: Replace code and update source map.

### `afterTransform(result: { code: string, map?: any }, context: TransformContext)`
- **Timing**: Receives the final compiled code output from RayCompiler.
- **Use cases**: Code instrumentation, appending banners, final diagnostics.

## Guarantees & Constraints

- **React Export Proxy Compatibility**: The React HMR Export Proxy Pattern remains completely active for React components.
- **Zero-Plugin Fast Path**: When no transform plugins are registered, Ray skips lifecycle hooks entirely and executes `compiler.compile()` directly (<0.1ms overhead).
- **Clean Error Formatting**: Plugin failures in any stage report: `[Plugin: <name>] <stage> error in <filename>: <message>`.
