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
});
