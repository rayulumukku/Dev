export class DiagnosticsView {
  static formatDiagnostics(diagnostics: any[]): Record<string, any> {
    return {
      count: diagnostics.length,
      diagnostics,
    };
  }
}
