import { Diagnostic, DiagnosticSeverity } from './types.js';
import { ImportResolver } from './ImportResolver.js';
import path from 'path';

export class DiagnosticsProvider {
  private importResolver: ImportResolver;

  constructor(projectRoot: string) {
    this.importResolver = new ImportResolver(projectRoot);
  }

  validateDocument(uri: string, content: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    // 1. Unresolved import detection in code / config
    const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
    let match;
    const lines = content.split('\n');

    while ((match = importRegex.exec(content)) !== null) {
      const impPath = match[1];
      if (impPath.startsWith('.') || impPath.startsWith('@/')) {
        const resolved = this.importResolver.resolveImport(impPath, uri);
        if (!resolved) {
          // Find line number
          const offset = match.index;
          const lineNum = content.slice(0, offset).split('\n').length - 1;
          const lineText = lines[lineNum] || '';
          const charStart = lineText.indexOf(impPath);

          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            code: 'UNRESOLVED_IMPORT',
            source: 'Ray Language Server',
            message: `Cannot resolve import "${impPath}". Check file existence or path alias configuration.`,
            range: {
              start: { line: lineNum, character: Math.max(0, charStart) },
              end: { line: lineNum, character: Math.max(0, charStart + impPath.length) },
            },
          });
        }
      }
    }

    // 2. Ray config validation (deprecated options or syntax errors)
    if (uri.endsWith('ray.config.ts') || uri.endsWith('ray.config.js')) {
      if (content.includes('terserOptions')) {
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          code: 'DEPRECATED_OPTION',
          source: 'Ray Language Server',
          message: 'Option "terserOptions" is deprecated. Ray uses built-in AST minification engine.',
          range: { start: { line: 0, character: 0 }, end: { line: 0, character: 20 } },
        });
      }
    }

    return diagnostics;
  }
}
