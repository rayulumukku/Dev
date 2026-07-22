export type ErrorCategory =
  | 'build'
  | 'transform'
  | 'runtime'
  | 'hmr'
  | 'plugin'
  | 'css'
  | 'vue'
  | 'react';

export interface StackFrameInfo {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  functionName?: string;
  sourceCodeSnippet?: string;
}

export interface CodeFrameSnippet {
  lines: Array<{ lineNumber: number; content: string; isTarget: boolean }>;
  startLine: number;
  endLine: number;
  columnNumber?: number;
}

export interface DiagnosticHint {
  message: string;
  suggestion?: string;
  docUrl?: string;
}

export interface PluginDiagnostic {
  pluginName: string;
  hints: DiagnosticHint[];
  context?: Record<string, any>;
}

export interface OverlayError {
  id: string;
  category: ErrorCategory;
  title: string;
  message: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  stackFrames: StackFrameInfo[];
  codeFrame?: CodeFrameSnippet;
  diagnostics?: DiagnosticHint[];
  pluginDiagnostics?: PluginDiagnostic[];
  timestamp: number;
}

export interface OverlayConfig {
  theme?: 'dark' | 'light' | 'auto';
  maxDuplicateHistory?: number;
  enableKeyboardNavigation?: boolean;
}
