import { RuntimeRegistry } from './RuntimeRegistry.js';
export class DiagnosticsRuntime {
    static collectDiagnostics(id, code) {
        const diagnostics = [];
        const adapters = RuntimeRegistry.resolveActiveAdapters(id);
        for (const adapter of adapters) {
            if (adapter.capabilities.diagnostics && adapter.hooks?.onDiagnostics) {
                diagnostics.push(...adapter.hooks.onDiagnostics(id, code));
            }
        }
        return diagnostics;
    }
}
//# sourceMappingURL=DiagnosticsRuntime.js.map