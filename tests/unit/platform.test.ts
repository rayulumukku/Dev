import { describe, it, expect } from 'vitest';
import { RuntimeAdapter } from '../../packages/core/src/runtime/index.js';
import { LiveASTViewer } from '../../packages/core/src/live/astViewer.js';
import { VisualPluginDebugger } from '../../packages/core/src/live/pluginDebugger.js';
import { AutoBundleSplitter } from '../../packages/core/src/platform/bundleSplitter.js';
import { AutoLazyLoader } from '../../packages/core/src/platform/lazyLoader.js';
import { CompilerSuggestions } from '../../packages/core/src/ai/compilerSuggestions.js';
import { StaticPerformanceAnalyzer } from '../../packages/core/src/ai/staticPerformanceAnalyzer.js';

describe('Application Platform Tests', () => {

  // ─── RuntimeAdapter ──────────────────────────────────────────────────

  describe('RuntimeAdapter', () => {
    it('should detect the current runtime as "node" in test environment', () => {
      const runtime = RuntimeAdapter.detect();
      expect(runtime).toBe('node');
    });

    it('should return capabilities for node runtime', () => {
      const caps = RuntimeAdapter.capabilities();
      expect(caps.runtime).toBe('node');
      expect(caps.workers).toBe(true);
      expect(caps.fs).toBe(true);
      expect(caps.streams).toBe(true);
    });
  });

  // ─── LiveASTViewer ───────────────────────────────────────────────────

  describe('LiveASTViewer', () => {
    it('should store and retrieve AST snapshots', () => {
      const viewer = new LiveASTViewer();
      const ast = { type: 'Program', body: [{ type: 'ExpressionStatement' }] };
      viewer.update('/src/app.js', ast);

      const snap = viewer.get('/src/app.js');
      expect(snap).not.toBeNull();
      expect(snap!.file).toBe('/src/app.js');
      expect(snap!.nodeCount).toBeGreaterThan(0);
      expect(snap!.ast).toEqual(ast);
    });

    it('should return null for unknown files', () => {
      const viewer = new LiveASTViewer();
      expect(viewer.get('/unknown/file.js')).toBeNull();
    });

    it('should return a summary listing all tracked files', () => {
      const viewer = new LiveASTViewer();
      viewer.update('/a.js', { type: 'Program', body: [] });
      viewer.update('/b.js', { type: 'Program', body: [] });
      const summary = viewer.summary();
      expect(summary).toHaveLength(2);
      expect(summary.map((s) => s.file)).toContain('/a.js');
    });
  });

  // ─── VisualPluginDebugger ────────────────────────────────────────────

  describe('VisualPluginDebugger', () => {
    it('should record plugin transform events', () => {
      const debugger_ = new VisualPluginDebugger();
      debugger_.record('jsxPlugin', '/src/App.jsx', 'const a = 1;', 'const a = 1; // transformed', 1.23);
      const records = debugger_.all();
      expect(records).toHaveLength(1);
      expect(records[0].plugin).toBe('jsxPlugin');
      expect(records[0].durationMs).toBe(1.23);
    });

    it('should produce plugin timing stats', () => {
      const debugger_ = new VisualPluginDebugger();
      debugger_.record('jsxPlugin', '/a.jsx', 'a', 'b', 2.0);
      debugger_.record('jsxPlugin', '/b.jsx', 'c', 'd', 4.0);
      debugger_.record('cssPlugin', '/a.css', 'e', 'f', 1.0);
      const stats = debugger_.pluginStats();
      expect(stats['jsxPlugin'].totalMs).toBe(6.0);
      expect(stats['jsxPlugin'].avgMs).toBe(3.0);
      expect(stats['cssPlugin'].callCount).toBe(1);
    });

    it('should filter records by file', () => {
      const debugger_ = new VisualPluginDebugger();
      debugger_.record('jsxPlugin', '/src/A.jsx', 'a', 'a2', 1);
      debugger_.record('jsxPlugin', '/src/B.jsx', 'b', 'b2', 2);
      const forA = debugger_.forFile('/src/A.jsx');
      expect(forA).toHaveLength(1);
      expect(forA[0].file).toBe('/src/A.jsx');
    });
  });

  // ─── AutoBundleSplitter ──────────────────────────────────────────────

  describe('AutoBundleSplitter', () => {
    it('should analyse a mock graph and return a split analysis', () => {
      const splitter = new AutoBundleSplitter({ sizeThresholdBytes: 0, importerThreshold: 2 });

      // Mock graph
      const mockGraph = {
        modules: new Map([
          ['entry1.js', { id: 'entry1.js', dependencies: new Set(['shared.js']), importers: new Set() }],
          ['entry2.js', { id: 'entry2.js', dependencies: new Set(['shared.js']), importers: new Set() }],
          ['shared.js', { id: 'shared.js', dependencies: new Set(), importers: new Set(['entry1.js', 'entry2.js']),
            cachedOutput: { code: 'x'.repeat(10_000) } }],
        ]),
        getDependencies(id: string) {
          return this.modules.get(id)?.dependencies ?? new Set();
        },
      };

      const analysis = splitter.analyze(mockGraph, ['entry1.js', 'entry2.js']);
      expect(analysis.totalModules).toBe(3);
      const sharedPoint = analysis.splitPoints.find((s) => s.file === 'shared.js');
      expect(sharedPoint).toBeDefined();
      expect(sharedPoint!.sharedByCount).toBe(2);
      expect(sharedPoint!.recommendation).toBe('split');
    });
  });

  // ─── AutoLazyLoader ──────────────────────────────────────────────────

  describe('AutoLazyLoader', () => {
    it('should detect route-level component imports as lazy-load candidates', () => {
      const loader = new AutoLazyLoader();
      const code = [
        `import HomePage from './pages/HomePage';`,
        `import Button from './components/Button';`,
        `import AboutPage from './routes/AboutPage';`,
      ].join('\n');

      const analysis = loader.analyze(code, '/src/App.jsx');
      expect(analysis.candidates.length).toBeGreaterThanOrEqual(2);
      const specifiers = analysis.candidates.map((c) => c.specifier);
      expect(specifiers).toContain('./pages/HomePage');
      expect(specifiers).toContain('./routes/AboutPage');
    });

    it('should not flag non-route components', () => {
      const loader = new AutoLazyLoader();
      const code = `import Button from './components/Button';`;
      const analysis = loader.analyze(code, '/src/App.jsx');
      expect(analysis.candidates).toHaveLength(0);
    });

    it('should generate React.lazy() suggestions', () => {
      const loader = new AutoLazyLoader();
      const code = `import HomePage from './pages/HomePage';`;
      const { candidates } = loader.analyze(code, '/src/App.jsx');
      expect(candidates[0].reactSuggestion).toContain('React.lazy');
      expect(candidates[0].reactSuggestion).toContain('HomePage');
    });
  });

  // ─── CompilerSuggestions ─────────────────────────────────────────────

  describe('CompilerSuggestions', () => {
    const suggestions = new CompilerSuggestions();

    it('should detect console.log calls', () => {
      const code = `const x = 1;\nconsole.log(x);`;
      const s = suggestions.analyze(code, '/src/app.js');
      expect(s.some((r) => r.rule === 'ray/no-console-log')).toBe(true);
    });

    it('should detect inline object JSX props', () => {
      const code = `<MyComp style={{ color: 'red' }} />`;
      const s = suggestions.analyze(code, '/src/app.jsx');
      expect(s.some((r) => r.rule === 'react/no-inline-object-prop')).toBe(true);
    });

    it('should detect missing key prop in mapped JSX', () => {
      const code = `{items.map(item => <li>{item}</li>)}`;
      const s = suggestions.analyze(code, '/src/list.jsx');
      expect(s.some((r) => r.rule === 'react/missing-key')).toBe(true);
    });

    it('should not flag clean code', () => {
      const code = `export const answer = 42;`;
      const s = suggestions.analyze(code, '/src/clean.js');
      expect(s).toHaveLength(0);
    });
  });

  // ─── StaticPerformanceAnalyzer ───────────────────────────────────────

  describe('StaticPerformanceAnalyzer', () => {
    it('should produce a performance analysis from a mock graph', () => {
      const analyzer = new StaticPerformanceAnalyzer({ topN: 3 });

      const mockGraph = {
        modules: new Map([
          ['entry.js', {
            id: 'entry.js',
            dependencies: new Set(['heavy.jsx']),
            importers: new Set(),
            cachedOutput: { code: 'const x = 1;' }
          }],
          ['heavy.jsx', {
            id: 'heavy.jsx',
            dependencies: new Set(),
            importers: new Set(['entry.js']),
            cachedOutput: { code: `export default function HeavyComp() { return <div style={{ color: 'red' }} />; }` }
          }],
        ]),
        getDependencies(id: string) {
          return this.modules.get(id)?.dependencies ?? new Set();
        },
      };

      const analysis = analyzer.analyze(mockGraph, ['entry.js']);
      expect(analysis.modules.length).toBe(2);
      expect(typeof analysis.totalEstimatedBytes).toBe('number');
      expect(analysis.heaviestModules.length).toBeGreaterThan(0);
    });
  });
});
