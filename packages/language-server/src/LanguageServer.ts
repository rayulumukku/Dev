import { ServerCapabilities, Diagnostic, CompletionItem, Hover, Location, CodeAction, Position, Range } from './types.js';
import { DiagnosticsProvider } from './DiagnosticsProvider.js';
import { CompletionProvider } from './CompletionProvider.js';
import { HoverProvider } from './HoverProvider.js';
import { DefinitionProvider } from './DefinitionProvider.js';
import { ReferenceProvider } from './ReferenceProvider.js';
import { CodeActionProvider } from './CodeActionProvider.js';
import { WorkspaceManager } from './Workspace.js';

export class RayLanguageServer {
  private projectRoot: string;
  private diagnosticsProvider: DiagnosticsProvider;
  private completionProvider = new CompletionProvider();
  private hoverProvider = new HoverProvider();
  private definitionProvider: DefinitionProvider;
  private referenceProvider = new ReferenceProvider();
  private codeActionProvider = new CodeActionProvider();
  private workspaceManager: WorkspaceManager;

  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.diagnosticsProvider = new DiagnosticsProvider(projectRoot);
    this.definitionProvider = new DefinitionProvider(projectRoot);
    this.workspaceManager = new WorkspaceManager([projectRoot]);
  }

  getCapabilities(): ServerCapabilities {
    return {
      textDocumentSync: 1,
      completionProvider: { resolveProvider: true, triggerCharacters: ['.', ':', '/', '@'] },
      hoverProvider: true,
      definitionProvider: true,
      referencesProvider: true,
      documentSymbolProvider: true,
      workspaceSymbolProvider: true,
      codeActionProvider: true,
    };
  }

  onDiagnostics(uri: string, content: string): Diagnostic[] {
    return this.diagnosticsProvider.validateDocument(uri, content);
  }

  onCompletion(uri: string, position: Position, content: string): CompletionItem[] {
    return this.completionProvider.getCompletions(uri, position, content);
  }

  onHover(uri: string, position: Position, content: string): Hover | null {
    return this.hoverProvider.getHover(uri, position, content);
  }

  onDefinition(uri: string, position: Position, content: string): Location | null {
    return this.definitionProvider.getDefinition(uri, position, content);
  }

  onReferences(uri: string, position: Position, content: string): Location[] {
    return this.referenceProvider.getReferences(uri, position, content);
  }

  onCodeAction(uri: string, range: Range, diagnostics: Diagnostic[]): CodeAction[] {
    return this.codeActionProvider.getCodeActions(uri, range, diagnostics);
  }
}
