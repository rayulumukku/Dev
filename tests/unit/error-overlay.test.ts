import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorOverlayV2 } from '../../packages/hmr-runtime/src/overlay/ErrorOverlay.js';
import { generateCodeFrame } from '../../packages/hmr-runtime/src/overlay/CodeFrame.js';
import { parseStackTrace } from '../../packages/hmr-runtime/src/overlay/StackTrace.js';
import { getSuggestedFixes } from '../../packages/hmr-runtime/src/overlay/Diagnostics.js';
import { OverlayRecoveryTracker } from '../../packages/hmr-runtime/src/overlay/Recovery.js';

describe('HMR Error Overlay Version 2 (PR-21)', () => {
  let overlay: ErrorOverlayV2;

  beforeEach(() => {
    overlay = new ErrorOverlayV2();
  });

  it('should parse runtime, transform, and plugin errors into normalized OverlayError objects', () => {
    const rawError = new Error('Cannot find module "./Button"');
    const err = overlay.showError(rawError, 'transform');

    expect(err.category).toBe('transform');
    expect(err.message).toBe('Cannot find module "./Button"');
    expect(err.diagnostics?.length).toBeGreaterThan(0);
  });

  it('should generate highlighted code frames with carets around target line', () => {
    const code = `const a = 10;\nconst b = 20;\nconst c = a + b;\nconsole.log(c);`;
    const snippet = generateCodeFrame(code, 3, 5);

    expect(snippet.lines.length).toBe(4);
    expect(snippet.lines.find((l) => l.isTarget)?.lineNumber).toBe(3);
  });

  it('should parse stack traces into structured frames', () => {
    const stack = `Error: test\n    at Component (C:/project/src/App.tsx:15:20)\n    at render (C:/project/src/index.tsx:30:10)`;
    const frames = parseStackTrace(stack);

    expect(frames.length).toBe(2);
    expect(frames[0].functionName).toBe('Component');
    expect(frames[0].lineNumber).toBe(15);
  });

  it('should provide actionable diagnostic suggestions for unresolved imports and syntax errors', () => {
    const hints = getSuggestedFixes('Failed to resolve import "./MissingComponent"');

    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0].message).toContain('Unresolved import');
  });

  it('should track errors and dismiss overlay automatically on recovery', () => {
    const tracker = new OverlayRecoveryTracker();
    tracker.registerError('err-1');
    expect(tracker.hasErrors()).toBe(true);

    const isAllResolved = tracker.resolveError('err-1');
    expect(isAllResolved).toBe(true);
    expect(tracker.hasErrors()).toBe(false);
  });

  it('should parse Firefox and Safari stack traces into structured frames', () => {
    const ffStack = `render@http://localhost:3000/src/App.tsx:15:20\n@http://localhost:3000/src/main.jsx:30:10`;
    const frames = parseStackTrace(ffStack);

    expect(frames.length).toBe(2);
    expect(frames[0].functionName).toBe('render');
    expect(frames[0].fileName).toBe('http://localhost:3000/src/App.tsx');
    expect(frames[0].lineNumber).toBe(15);
    expect(frames[0].columnNumber).toBe(20);
    expect(frames[1].functionName).toBe('anonymous');
    expect(frames[1].lineNumber).toBe(30);
  });

  it('should safely handle empty or missing source code in code frame generator', () => {
    const emptyFrame = generateCodeFrame('', 5);
    expect(emptyFrame.lines.length).toBe(0);

    const undefFrame = generateCodeFrame(undefined as any, 1);
    expect(undefFrame.lines.length).toBe(0);
  });

  it('should extract fileName and lineNumber from stack frames when not on rawError object', () => {
    const err = new Error('Runtime bug occurred');
    err.stack = `Error: Runtime bug occurred\n    at renderComponent (http://localhost:3000/src/Button.tsx:42:10)`;
    const parsed = overlay.showError(err, 'runtime');

    expect(parsed.fileName).toBe('http://localhost:3000/src/Button.tsx');
    expect(parsed.lineNumber).toBe(42);
    expect(parsed.columnNumber).toBe(10);
  });
});
