# Ray Ecosystem Architecture & Package Classification Report

This document specifies the official repository organization, package classification matrix, dependency boundary rules, and maintenance guidelines for the Ray monorepo.

---

## 1. Package Classification Matrix

| Group | Package | Purpose | Boundary Constraints |
| :--- | :--- | :--- | :--- |
| **Core** | `@ray/core` | Core orchestrator & build pipeline | Zero framework dependencies |
| **Core** | `@ray/transform` | AST Transformation pipeline | Depends only on `@ray/core` |
| **Core** | `@ray/dev-server` | HMR dev server engine | No framework-specific logic |
| **Core** | `@ray/hmr-runtime` | Browser HMR client runtime | Standalone browser runtime |
| **Core** | `@ray/incremental-build` | Persistent disk cache engine | Storage & hashing only |
| **Core** | `@ray/compiler-rust` | Native Rust FFI lexer/shaker | FFI bridge & JS fallback |
| **CLI** | `@ray/cli` | Command-line interface orchestrator | Intermediary CLI commands |
| **CLI** | `create-ray` | Project scaffolding engine | Template initializer |
| **CLI** | `create-ray-plugin` | Plugin scaffolding engine | Plugin template generator |
| **CLI** | `create-deployment-adapter` | Adapter scaffolding engine | Adapter template generator |
| **Plugin API** | `@ray/plugin-sdk` | Authoring toolkit for plugins | Public plugin hooks only |
| **Plugin API** | `@ray/plugin-registry` | Plugin resolution & validation | Integrity check only |
| **Plugin API** | `@ray/plugin-manager` | Dynamic plugin lifecycle manager | Lifecycle orchestrator |
| **Frameworks** | `@ray/framework-runtime` | Framework adapter layer | Common framework interface |
| **Frameworks** | `@ray/plugin-svelte` | Official Svelte 4 compiler plugin | Framework adapter only |
| **Frameworks** | `@ray/plugin-solid` | Official SolidJS compiler plugin | Framework adapter only |
| **Frameworks** | `@ray/plugin-angular` | Official Angular compiler plugin | Framework adapter only |
| **Frameworks** | `@ray/react-server` | RSC Flight renderer pipeline | Isolated React RSC engine |
| **Frameworks** | `@ray/server-actions` | Framework Server Actions engine | Isolated server action dispatcher |
| **Adapters** | `@ray/deployment` | Provider-agnostic deployment | Packaging & manifests only |
| **Tooling** | `@ray/project-graph` | Workspace task scheduler | Graph analysis only |
| **Tooling** | `@ray/test-runner` | Native unit/integration test engine | Pluggable adapters |
| **Tooling** | `@ray/test-adapter` | Test environment adapters | Browser / Node runner |
| **Tooling** | `@ray/observability` | Privacy-first telemetry & traces | Local trace collector |
| **Tooling** | `@ray/inspector` | Developer Inspector server | Localhost WebSocket stream |
| **Tooling** | `@ray/edge-runtime` | Web-standard Edge runtime layer | Web standard APIs |
| **Tooling** | `@ray/release` | Monorepo release planner | Version & Changelog |
| **Tooling** | `@ray/api-contract` | Public API stability framework | API diff & validation |

---

## 2. Dependency Hierarchy Rules

1. **Strict Upward Layering**: Core packages (`@ray/core`, `@ray/transform`, `@ray/compiler-rust`, `@ray/dev-server`) must **NEVER** import or depend on Framework plugins (`@ray/plugin-svelte`, `@ray/plugin-solid`, `@ray/plugin-angular`, `@ray/react-server`).
2. **Public API Boundaries**: Framework plugins and deployment adapters consume only public APIs exposed by `@ray/plugin-sdk`, `@ray/framework-runtime`, and `@ray/deployment`.
3. **No Circular Dependencies**: Tooling packages (`@ray/project-graph`, `@ray/observability`, `@ray/inspector`) must remain decoupled without circular links.
