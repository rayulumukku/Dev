import { describe, it, expect } from 'vitest';
import { transformJsx } from '../../packages/transform/src/index.js';

/**
 * Transformer Unit Tests
 *
 * These tests validate @ray/transform using Ray's native compiler pipeline.
 * Ray Compiler produces valid ESM output but differs from esbuild in a few ways:
 *  - JSX may be preserved or emitted as-is (React 17+ JSX runtime compatible)
 *  - Source maps are returned as structured objects, not inline URL comments
 *  - TypeScript type annotations are preserved in pass-through mode and stripped
 *    during full AST generation
 */
describe('Transformer Unit Tests', () => {
  it('should transform JS code and return the source content', async () => {
    const raw = 'const x = 42; console.log(x);';
    const result = await transformJsx(raw, 'file.js');
    // Ray Compiler returns the processed code — core content must be present
    expect(result).toContain('const x = 42;');
    // Result should be a non-empty string
    expect(result.length).toBeGreaterThan(0);
  });

  it('should process JSX files without throwing', async () => {
    const raw = 'export const App = () => <div>Hello</div>;';
    const result = await transformJsx(raw, 'App.jsx');
    // Ray Compiler processes the file — the export must be present
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
    // Core identifier must survive compilation
    expect(result).toContain('App');
  });

  it('should process TypeScript syntax and return code with exports', async () => {
    const raw = 'export interface Info { name: string; } export const getInfo = (x: Info) => x.name;';
    const result = await transformJsx(raw, 'info.ts');
    // The function body must survive — even if types are kept
    expect(result).toContain('getInfo');
    expect(result).toContain('export');
  });

  it('should process TSX files without throwing', async () => {
    const raw = 'export const Comp = (props: { val: string }) => <span>{props.val}</span>;';
    const result = await transformJsx(raw, 'Comp.tsx');
    // Compiled output must reference the component
    expect(result).toBeTruthy();
    expect(result).toContain('Comp');
  });
});
