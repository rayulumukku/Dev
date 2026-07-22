# Monorepo and Workspace Support (`@ray/workspace`)

Ray provides first-class support for monorepos managed by **pnpm**, **npm**, **Yarn**, and **Bun**.

## Auto-Detection & Resolution

Ray automatically detects workspace root configurations (`pnpm-workspace.yaml`, `package.json` workspaces) and maps workspace specifiers directly to local source code (`@monorepo/ui` -> `packages/ui/src/index.ts`) rather than compiled `node_modules` copies.

## Features

- **Cross-Package HMR**: Modifying shared components in `packages/ui` immediately triggers hot updates in `apps/web`.
- **Unified Graphing**: Manages all workspace modules in a single dependency graph.
- **Isolated Caching**: Caches transformed artifacts per workspace package under `node_modules/.cache/ray/workspaces/`.
