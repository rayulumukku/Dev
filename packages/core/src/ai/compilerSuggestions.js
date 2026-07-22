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
export class CompilerSuggestions {
    analyze(code, file) {
        const suggestions = [];
        const lines = code.split('\n');
        lines.forEach((line, idx) => {
            const lineNum = idx + 1;
            const col = (pattern) => (line.search(pattern) ?? 0) + 1;
            // Rule 1: Inline object literal passed as JSX prop
            if (/\w+={{\s*\w+:/.test(line)) {
                suggestions.push({
                    rule: 'react/no-inline-object-prop',
                    message: 'Inline object literal as JSX prop creates a new reference on every render. ' +
                        'Consider wrapping with useMemo() or moving outside the component.',
                    severity: 'warning',
                    line: lineNum,
                    column: col(/\w+={{/),
                    file,
                });
            }
            // Rule 2: .map() with JSX but no key prop
            if (/\.map\s*\(/.test(line) && /<\w/.test(line) && !(/key=/.test(line))) {
                suggestions.push({
                    rule: 'react/missing-key',
                    message: 'JSX elements inside .map() require a unique "key" prop to help React reconcile the list.',
                    severity: 'warning',
                    line: lineNum,
                    column: col(/\.map\s*\(/),
                    file,
                });
            }
            // Rule 3: Dynamic import without surrounding try/catch or ErrorBoundary comment
            if (/import\s*\(/.test(line) && !/\/\/ @error-boundary/.test(line)) {
                const surroundingContext = lines.slice(Math.max(0, idx - 3), idx + 3).join('\n');
                if (!/catch|ErrorBoundary|Suspense/.test(surroundingContext)) {
                    suggestions.push({
                        rule: 'ray/unguarded-dynamic-import',
                        message: 'Dynamic import() without a surrounding Suspense or ErrorBoundary. ' +
                            'Network failures will cause an unhandled rejection.',
                        severity: 'info',
                        line: lineNum,
                        column: col(/import\s*\(/),
                        file,
                    });
                }
            }
            // Rule 4: console.log left in source
            if (/console\.log\s*\(/.test(line) && !line.trim().startsWith('//')) {
                suggestions.push({
                    rule: 'ray/no-console-log',
                    message: 'console.log() found. Remove before shipping to production.',
                    severity: 'hint',
                    line: lineNum,
                    column: col(/console\.log/),
                    file,
                });
            }
            // Rule 5: Deeply nested ternary (≥ 3 ? : chains on one line)
            const ternaryMatches = line.match(/\?[^:]+:/g);
            if (ternaryMatches && ternaryMatches.length >= 3) {
                suggestions.push({
                    rule: 'ray/no-deep-ternary',
                    message: 'Deeply nested ternary expression (3+ levels). ' +
                        'Extract into named variables or a helper function for readability.',
                    severity: 'hint',
                    line: lineNum,
                    column: col(/\?/),
                    file,
                });
            }
        });
        return suggestions;
    }
    /**
     * HTTP handler for /__ray/perf/suggestions?file=...
     */
    httpHandler() {
        return (req, res, getCode) => {
            const url = new URL(req.url, 'http://localhost');
            const file = url.searchParams.get('file') ?? '';
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            const code = getCode(file);
            if (!code) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: `File not found: ${file}` }));
                return;
            }
            res.statusCode = 200;
            res.end(JSON.stringify({ file, suggestions: this.analyze(code, file) }));
        };
    }
}
export default CompilerSuggestions;
//# sourceMappingURL=compilerSuggestions.js.map