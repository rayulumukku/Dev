# Official Ray Language Server (`@ray/language-server`)

The `@ray/language-server` package provides an official Language Server Protocol (LSP) implementation delivering rich IDE features (diagnostics, completions, hover, navigation, code actions, and workspace support) for Ray projects.

## Architecture

The Ray Language Server operates as an independent, lightweight LSP process:

1. **ImportResolver**: Resolves module imports, path aliases (`@/`), and node_modules packages.
2. **ConfigProvider**: Maintains schema rules, option documentations, and default values for `ray.config.ts`.
3. **DiagnosticsProvider**: Analyzes document contents for unresolved imports, deprecated options, syntax errors, and plugin mismatches.
4. **CompletionProvider**: Offers intelligent autocompletion for `ray.config` properties, plugins, CLI parameters, and aliases.
5. **HoverProvider**: Displays rich markdown documentation when hovering over configuration options and plugins.
6. **DefinitionProvider & ReferenceProvider**: Enables "Go to Definition" and "Find References" across workspace files.
7. **CodeActionProvider**: Provides quick-fix code actions for unresolved imports and deprecated configuration options.
8. **WorkspaceManager & ProjectManager**: Discovers single projects, monorepos, and linked workspace packages.
9. **RayLanguageServer**: Handles incoming LSP protocol JSON-RPC requests.

## Supported LSP Features

- **Initialization & Shutdown**: `initialize`, `shutdown`, `exit`.
- **Text Synchronization**: `textDocument/didOpen`, `textDocument/didChange`, `textDocument/didClose`.
- **Diagnostics**: `textDocument/publishDiagnostics`.
- **Completions**: `textDocument/completion`.
- **Hover**: `textDocument/hover`.
- **Navigation**: `textDocument/definition`, `textDocument/references`.
- **Code Actions**: `textDocument/codeAction`.

## IDE Integration (VS Code)

The official VS Code extension (`@ray/vscode-extension`) connects automatically to `@ray/language-server` upon activating a Ray workspace directory:

```typescript
import { RayLanguageServer } from '@ray/language-server';

const server = new RayLanguageServer(workspaceDir);
const capabilities = server.getCapabilities();
```

## Performance & Build Independence Guarantee

- **Zero Build Impact**: The language server runs completely separate from Ray production bundler and dev server builds.
- **Low Memory & Background Analysis**: Document diagnostics and completions execute in background microtasks with cached lookup indices.
