/**
 * CompilerSuggestions
 *
 * Heuristic-based, AST-aware analysis that emits structured performance and
 * correctness hints without requiring any external AI API.
 *
 * Rules implemented:
 *  1. Large inline object literals as JSX props → suggest useMemo
 *  2. Mapped JSX arrays without a `key` prop → warn
 *  3. Dynamic import() without an error boundary → warn
 *  4. console.log() calls in production code → note
 *  5. Deeply nested ternary expressions → readability hint
 *
 * Satisfies: Deterministic · Benchmarkable · Plugin-driven · Zero Global State
 */
export type SuggestionSeverity = 'error' | 'warning' | 'info' | 'hint';
export interface CompilerSuggestion {
    rule: string;
    message: string;
    severity: SuggestionSeverity;
    line: number;
    column: number;
    file: string;
}
export declare class CompilerSuggestions {
    analyze(code: string, file: string): CompilerSuggestion[];
    /**
     * HTTP handler for /__ray/perf/suggestions?file=...
     */
    httpHandler(): (req: any, res: any, getCode: (file: string) => string | null) => void;
}
export default CompilerSuggestions;
//# sourceMappingURL=compilerSuggestions.d.ts.map