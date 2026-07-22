export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Location {
  uri: string;
  range: Range;
}

export enum DiagnosticSeverity {
  Error = 1,
  Warning = 2,
  Information = 3,
  Hint = 4,
}

export interface Diagnostic {
  range: Range;
  severity: DiagnosticSeverity;
  code?: string | number;
  source?: string;
  message: string;
}

export enum CompletionItemKind {
  Text = 1,
  Method = 2,
  Function = 3,
  Constructor = 4,
  Field = 5,
  Variable = 6,
  Class = 7,
  Interface = 8,
  Module = 9,
  Property = 10,
  Keyword = 14,
  Snippet = 15,
}

export interface CompletionItem {
  label: string;
  kind?: CompletionItemKind;
  detail?: string;
  documentation?: string;
  insertText?: string;
}

export interface Hover {
  contents: string | { language: string; value: string };
  range?: Range;
}

export enum SymbolKind {
  File = 1,
  Module = 2,
  Namespace = 3,
  Package = 4,
  Class = 5,
  Method = 6,
  Property = 7,
  Field = 8,
  Function = 12,
  Variable = 13,
}

export interface DocumentSymbol {
  name: string;
  kind: SymbolKind;
  range: Range;
  selectionRange: Range;
  children?: DocumentSymbol[];
}

export interface CodeAction {
  title: string;
  kind?: string;
  diagnostics?: Diagnostic[];
  edit?: {
    changes: Record<string, { range: Range; newText: string }[]>;
  };
}

export interface ServerCapabilities {
  textDocumentSync?: number;
  completionProvider?: { resolveProvider?: boolean; triggerCharacters?: string[] };
  hoverProvider?: boolean;
  definitionProvider?: boolean;
  referencesProvider?: boolean;
  documentSymbolProvider?: boolean;
  workspaceSymbolProvider?: boolean;
  codeActionProvider?: boolean;
}
