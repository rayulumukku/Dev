/**
 * AutoLazyLoader
 *
 * Inspects a compiled module's AST for route-level component imports
 * and generates recommended React.lazy() / defineAsyncComponent() wrappers
 * for automatic lazy loading.
 *
 * Does NOT mutate source — returns a transformation suggestion only,
 * which plugins may apply.
 *
 * Satisfies: Plugin-driven · Deterministic · Framework-agnostic · Zero Global State
 */
export interface LazyLoadCandidate {
    /** Import specifier as written in source */
    specifier: string;
    /** Local binding name */
    localName: string;
    /** Line number (1-indexed) */
    line: number;
    /** Suggested React.lazy() wrapper code */
    reactSuggestion: string;
    /** Suggested Vue defineAsyncComponent() wrapper code */
    vueSuggestion: string;
}
export interface LazyLoadAnalysis {
    file: string;
    candidates: LazyLoadCandidate[];
    /** Ready-to-insert React.lazy preamble block */
    reactPreamble: string;
}
export declare class AutoLazyLoader {
    /**
     * Minimum component name length to be considered route-level.
     * Single-letter components (e.g. `A`) are not candidates.
     */
    private minNameLength;
    constructor(options?: {
        minNameLength?: number;
    });
    /**
     * Analyse a source file and return lazy-load candidates.
     * Heuristic: default-import of a PascalCase identifier from a relative path
     * that contains 'page', 'route', 'view', or 'screen'.
     */
    analyze(code: string, file: string): LazyLoadAnalysis;
    /**
     * Apply React.lazy() rewrites to source code. Returns modified code.
     */
    applyReactLazy(code: string, file: string): string;
}
export default AutoLazyLoader;
//# sourceMappingURL=lazyLoader.d.ts.map