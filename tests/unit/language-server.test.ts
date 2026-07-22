import { describe, it, expect } from 'vitest';
import {
  RayLanguageServer,
  ImportResolver,
  ConfigProvider,
  DiagnosticsProvider,
  CompletionProvider,
  HoverProvider,
  DefinitionProvider,
  ReferenceProvider,
  CodeActionProvider,
  WorkspaceManager,
  ProjectManager,
  startServer,
} from '../../packages/language-server/src/index.js';
import { activateExtension } from '../../packages/vscode-extension/src/extension.js';
import fs from 'fs';
import path from 'path';

describe('Official Ray Language Server (PR-35)', () => {
  const tempDir = path.join(process.cwd(), 'temp-lsp-test');

  it('1. should initialize server and return capabilities', () => {
    const server = startServer(tempDir);
    const caps = server.getCapabilities();

    expect(caps.completionProvider).toBeDefined();
    expect(caps.hoverProvider).toBe(true);
    expect(caps.definitionProvider).toBe(true);
    expect(caps.codeActionProvider).toBe(true);
  });

  it('2. should resolve imports and path aliases', () => {
    const resolver = new ImportResolver(process.cwd(), { '@': 'packages' });
    const res = resolver.resolveImport('@/core/src/index.ts', 'App.tsx');

    expect(res).toBeDefined();
    expect(res).toContain('packages');
  });

  it('3. should provide diagnostics for unresolved imports and deprecated config options', () => {
    const provider = new DiagnosticsProvider(process.cwd());
    const code = `import { x } from './non-existent-file-xyz';\nexport default { terserOptions: {} };`;

    const diags = provider.validateDocument('ray.config.ts', code);
    expect(diags.length).toBeGreaterThan(0);

    const unresolved = diags.find(d => d.code === 'UNRESOLVED_IMPORT');
    const deprecated = diags.find(d => d.code === 'DEPRECATED_OPTION');

    expect(unresolved).toBeDefined();
    expect(deprecated).toBeDefined();
  });

  it('4. should provide code completions for ray.config.ts', () => {
    const provider = new CompletionProvider();
    const items = provider.getCompletions('ray.config.ts', { line: 0, character: 0 }, '');

    expect(items.length).toBeGreaterThan(0);
    expect(items.some(i => i.label === 'build.outDir')).toBe(true);
    expect(items.some(i => i.label === 'mdx()')).toBe(true);
  });

  it('5. should return hover documentation for config options', () => {
    const provider = new HoverProvider();
    const hover = provider.getHover('ray.config.ts', { line: 0, character: 0 }, 'export default { mode: "production" };');

    expect(hover).not.toBeNull();
    expect(hover?.contents).toContain('mode');
  });

  it('6. should resolve definitions for imported files', () => {
    const provider = new DefinitionProvider(process.cwd());
    const code = `import { RayCore } from './packages/core/src/index.ts';`;
    const loc = provider.getDefinition('App.ts', { line: 0, character: 10 }, code);

    expect(loc).not.toBeNull();
    expect(loc?.uri).toContain('index.ts');
  });

  it('7. should find references and code actions', () => {
    const refProvider = new ReferenceProvider();
    const refs = refProvider.getReferences('App.ts', { line: 0, character: 0 }, 'const a = 1;');
    expect(refs.length).toBeGreaterThan(0);

    const actionProvider = new CodeActionProvider();
    const actions = actionProvider.getCodeActions('ray.config.ts', { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, [
      { code: 'DEPRECATED_OPTION', message: 'deprecated', severity: 2, range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } },
    ]);

    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].title).toContain('Remove deprecated option');
  });

  it('8. should manage workspace folders and discover projects', () => {
    const ws = new WorkspaceManager([tempDir]);
    expect(ws.getFolders()).toContain(tempDir);

    const pm = new ProjectManager();
    const projects = pm.findRayProjects(process.cwd());
    expect(projects.length).toBeGreaterThan(0);
  });

  it('9. should integrate VS Code extension with Language Server', () => {
    const testDir = path.join(process.cwd(), 'temp-lsp-ext-test');
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'ray.config.ts'), 'export default {};');

    const ext = activateExtension(testDir);
    expect(ext.active).toBe(true);
    expect(ext.server).not.toBeNull();

    const diags = ext.validateConfigText('import x from "./invalid";');
    expect(diags).toBeDefined();

    fs.rmSync(testDir, { recursive: true, force: true });
  });
});
