import { RuntimeRegistry } from './RuntimeRegistry.js';

export class DiagnosticsRuntime {
  static collectDiagnostics(id: string, code: string): any[] {
    const diagnostics: any[] = [];
    const adapters = RuntimeRegistry.resolveActiveAdapters(id);
    for (const adapter of adapters) {
      if (adapter.capabilities.diagnostics && adapter.hooks?.onDiagnostics) {
        diagnostics.push(...adapter.hooks.onDiagnostics(id, code));
      }
    }
    return diagnostics;
  }
}
