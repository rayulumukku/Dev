# Ray API Reference

This document is automatically generated from the source code.

## Resolver

*Source Location: [resolver/index.ts](file:///C:/Users/HP/Desktop/Devops-Pipelines/packages/core/src/resolver/index.ts)*

### `parseSpecifier` (function)

Parses an import specifier into its package name and subpath. E.g., 'react' -> { packageName: 'react', subpath: '.' } E.g., 'react-dom/client' -> { packageName: 'react-dom', subpath: './client' } E.g., '@babel/core/preset' -> { packageName: '@babel/core', subpath: './preset' }

### `resolveConditionalExports` (function)

Resolves conditional exports based on client ESM preferences.

## DependencyGraph

*Source Location: [graph/index.ts](file:///C:/Users/HP/Desktop/Devops-Pipelines/packages/core/src/graph/index.ts)*

Class or function entrypoint representing `DependencyGraph` module operations inside Ray.

## ModuleNode

*Source Location: [graph/moduleNode.ts](file:///C:/Users/HP/Desktop/Devops-Pipelines/packages/core/src/graph/moduleNode.ts)*

### `ModuleNode` (class)

Represents a single module in the dependency graph.

## buildProject

*Source Location: [build/index.ts](file:///C:/Users/HP/Desktop/Devops-Pipelines/packages/core/src/build/index.ts)*

### `buildProject` (async function)

Executes a production-optimized build of the Ray project. Supports splitting into client browser builds, target Node.js server bundles, SSG static HTML page compilation, and reusable Library Mode bundling.

## PluginContainer

*Source Location: [plugin/container.ts](file:///C:/Users/HP/Desktop/Devops-Pipelines/packages/core/src/plugin/container.ts)*

Class or function entrypoint representing `PluginContainer` module operations inside Ray.

## runOptimizer

*Source Location: [optimizer/index.ts](file:///C:/Users/HP/Desktop/Devops-Pipelines/packages/core/src/optimizer/index.ts)*

### `scanDeps` (async function)

Computes a collective hash of dependency versions, lockfiles, and configuration files. / function computeConfigHash(projectRoot: string, config: any): string { const hash = crypto.createHash('sha256'); const pkgJsonPath = path.join(projectRoot, 'package.json'); if (fs.existsSync(pkgJsonPath)) { try { const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')); hash.update(JSON.stringify(pkg.dependencies || {})); hash.update(JSON.stringify(pkg.devDependencies || {})); hash.update(JSON.stringify(pkg.peerDependencies || {})); } catch {} } const lockfiles = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']; for (const lock of lockfiles) { const lockPath = path.join(projectRoot, lock); if (fs.existsSync(lockPath)) { hash.update(fs.readFileSync(lockPath)); } } hash.update(JSON.stringify(config.optimizeDeps || {})); hash.update(JSON.stringify(config.define || {})); return hash.digest('hex'); } /** Recursively scans entry scripts for bare module imports using es-module-lexer.

### `runOptimizer` (async function)

Runs the optimization pipeline scanning, pre-bundling, and caching packages.

## RayCompiler

*Source Location: [compiler/index.ts](file:///C:/Users/HP/Desktop/Devops-Pipelines/packages/core/src/compiler/index.ts)*

Class or function entrypoint representing `RayCompiler` module operations inside Ray.

## RayCore

*Source Location: [index.ts](file:///C:/Users/HP/Desktop/Devops-Pipelines/packages/core/src/index.ts)*

Class or function entrypoint representing `RayCore` module operations inside Ray.

