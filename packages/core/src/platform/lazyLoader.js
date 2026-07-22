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
export class AutoLazyLoader {
    /**
     * Minimum component name length to be considered route-level.
     * Single-letter components (e.g. `A`) are not candidates.
     */
    minNameLength;
    constructor(options = {}) {
        this.minNameLength = options.minNameLength ?? 2;
    }
    /**
     * Analyse a source file and return lazy-load candidates.
     * Heuristic: default-import of a PascalCase identifier from a relative path
     * that contains 'page', 'route', 'view', or 'screen'.
     */
    analyze(code, file) {
        const candidates = [];
        const lines = code.split('\n');
        // Match: import ComponentName from './pages/...'
        const re = /^import\s+([A-Z][A-Za-z0-9]+)\s+from\s+['"]([^'"]+)['"]/;
        lines.forEach((line, idx) => {
            const m = re.exec(line.trim());
            if (!m)
                return;
            const [, localName, specifier] = m;
            if (localName.length < this.minNameLength)
                return;
            const isRouteLike = /page|route|view|screen|layout/i.test(specifier);
            if (!isRouteLike)
                return;
            const reactSuggestion = `const ${localName} = React.lazy(() => import('${specifier}'));`;
            const vueSuggestion = `const ${localName} = defineAsyncComponent(() => import('${specifier}'));`;
            candidates.push({
                specifier,
                localName,
                line: idx + 1,
                reactSuggestion,
                vueSuggestion,
            });
        });
        const reactPreamble = candidates
            .map((c) => c.reactSuggestion)
            .join('\n');
        return { file, candidates, reactPreamble };
    }
    /**
     * Apply React.lazy() rewrites to source code. Returns modified code.
     */
    applyReactLazy(code, file) {
        const { candidates } = this.analyze(code, file);
        let result = code;
        for (const c of candidates) {
            const originalImport = new RegExp(`import\\s+${c.localName}\\s+from\\s+['"]${c.specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"];?`, 'g');
            result = result.replace(originalImport, c.reactSuggestion);
        }
        return result;
    }
}
export default AutoLazyLoader;
//# sourceMappingURL=lazyLoader.js.map