# Ray Architecture Documentation

This document describes the internals, graph representations, and key processing pipelines of Ray v1.0.

---

## 1. Module Graph

The **Module Graph** tracks the resolved relationships between dependencies and modules during live dev compilation and production build cycles.

```mermaid
graph TD
  Main["src/main.jsx (Entry Node)"] --> App["src/App.jsx"]
  Main --> CSS["src/tailwind.css"]
  App --> Header["src/components/Header.tsx"]
  App --> Logo["src/assets/logo.png"]
  Header --> React["/@modules/react (Bare Dependency)"]
```

---

## 2. Compiler Pipeline

The compilation pipeline routes JavaScript, TypeScript, JSX, and TSX files through distinct lexing, parsing, optimization, plugin transform, and code generation phases.

```mermaid
graph LR
  Source["Source Code"] --> Lexer["Lexer (Token Stream)"]
  Lexer --> Parser["Parser (AST representation)"]
  Parser --> Optimizer["Optimizer (Constant folding, DCE)"]
  Optimizer --> Plugins["Plugins (transform hooks)"]
  Plugins --> Codegen["Codegen (JS output + Source Maps)"]
```

---

## 3. Plugin Lifecycle

The plugin container schedules and coordinates hooks during compiler startup, resolution, transformation, and shutdown.

```mermaid
sequenceDiagram
  participant C as Plugin Container
  participant P as Plugin Instance
  C->>P: configResolved(config)
  C->>P: buildStart()
  C->>P: resolveId(importee, importer)
  C->>P: load(id)
  C->>P: transform(code, id)
  C->>P: buildEnd()
```

---

## 4. HMR Flow

The HMR runtime processes watch notifications, computes update boundaries, invalidates changed modules, and pushes new code snippets to client websockets.

```mermaid
sequenceDiagram
  participant FS as File Watcher
  participant DS as Dev Server (HMR Middleware)
  participant WS as WebSocket Channel
  participant Cl as Client Browser (HMR Runtime)
  
  FS->>DS: File change detected on App.jsx
  DS->>DS: Invalidate App.jsx in Dependency Graph
  DS->>DS: Compute boundary updates (updatePlanner)
  DS->>WS: Broadcast HMR payloads (acceptedPath)
  WS->>Cl: Send payload { path, acceptedPath, timestamp }
  Cl->>Cl: Fetch new module code with timestamp query
  Cl->>Cl: Swap module cache and execute render()
```

---

## 5. SSR Flow

Ray dynamically compiles server entries and exposes a node-side renderer to hydrate static markups.

```mermaid
graph TD
  Req["Client Request /"] --> DevServer["Dev Server (ssrLoadModule)"]
  DevServer --> ServerEntry["src/entry-server.jsx"]
  ServerEntry --> HTML["Render App HTML"]
  HTML --> Response["Return index.html + Hydration script"]
```

---

## 6. Build Pipeline

The production builder compiles modules in parallel and merges outputs into optimized distributions.

```mermaid
graph LR
  Start["ray build command"] --> Prebundle["Pre-bundle npm dependencies"]
  Prebundle --> Compile["Parallel module compile (BuildScheduler)"]
  Compile --> TreeShake["Global Tree Shaking & DCE"]
  TreeShake --> Chunk["Chunk Merger & Asset Packaging"]
  Chunk --> Dist["Emit dist/ folder"]
```

---

## 7. Dependency Optimizer

The optimizer pre-bundles commonjs and esm packages to minimize browser network overhead.

```mermaid
graph TD
  Start["Dev server start"] --> Scan["Scan files for bare imports"]
  Scan --> CheckCache["Check cached metadata.json hash"]
  CheckCache -- Match -- > Dev["Serve immediately"]
  CheckCache -- Miss -- > Bundle["Pre-bundle bare modules via RayBundler"]
  Bundle --> Save["Write to .ray/cache and update metadata"]
```

---

## 8. Incremental Cache

The cache system hashes modules to optimize subsequent startup runs.

```mermaid
graph LR
  Source["Source Code changes"] --> Hash["Compute content SHA-256"]
  Hash --> CacheCheck["Lookup .ray/cache metadata"]
  CacheCheck -- Hit -- > Return["Load cached output and AST"]
  CacheCheck -- Miss -- > Compile["Run transform pipeline & save to cache"]
```

---

## 9. Ray Studio

Ray Studio provides visual telemetry insights, diagnostics graphs, and custom panel extendability.

```mermaid
graph TD
  Server["Dev Server Engine"] -- telemetry -- > WebSocket["WebSocket API Server"]
  WebSocket --> StudioHTML["Ray Studio Panel (studio.html)"]
  StudioHTML --> UI["Render Interactive Dev Telemetry Dashboards"]
```
