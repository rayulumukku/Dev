import { describe, it, expect } from 'vitest';
import { stripTypeScript } from '../../packages/core/src/plugin/config.js';

describe('stripTypeScript Enhancement Tests', () => {
  const evalExpr = (code: string) => {
    // Strip export default to evaluate the object/expression in new Function
    const expr = code.replace(/^export default\s+/, '').replace(/;$/, '');
    return new Function('return (' + expr + ')')();
  };

  it('should strip multi-parameter generics in satisfies without breaking internal commas', () => {
    const input = 'export default { root: "./src" } satisfies Record<string, any>;';
    const stripped = stripTypeScript(input);
    expect(stripped).not.toContain('satisfies');
    expect(stripped).not.toContain('Record');
    expect(() => evalExpr(stripped)).not.toThrow();
    expect(evalExpr(stripped)).toEqual({ root: './src' });
  });

  it('should strip multi-parameter Map generics in satisfies', () => {
    const input = 'export default { cache: new Map() } satisfies Map<string, number>;';
    const stripped = stripTypeScript(input);
    expect(stripped).not.toContain('satisfies');
    expect(() => evalExpr(stripped)).not.toThrow();
  });

  it('should preserve closing brackets and braces with inline satisfies in arrays and objects', () => {
    const input = 'export default { plugins: [1, 2] satisfies number[], other: { a: 1 } satisfies Record<string, number> };';
    const stripped = stripTypeScript(input);
    expect(stripped).not.toContain('satisfies');
    expect(stripped).toContain('[1, 2]');
    expect(stripped).toContain('{ a: 1 }');
    expect(() => evalExpr(stripped)).not.toThrow();
    expect(evalExpr(stripped)).toEqual({ plugins: [1, 2], other: { a: 1 } });
  });

  it('should handle nested generics in as casts', () => {
    const input = 'export default { headers: {} as Record<string, Array<string>> };';
    const stripped = stripTypeScript(input);
    expect(stripped).not.toContain('Record');
    expect(stripped).not.toContain('Array');
    expect(() => evalExpr(stripped)).not.toThrow();
    expect(evalExpr(stripped)).toEqual({ headers: {} });
  });

  it('should handle as const and chained as casts', () => {
    const input = 'const x = { mode: "production" } as const;\nconst y = "test" as unknown as string;';
    const stripped = stripTypeScript(input);
    expect(stripped).not.toContain('as const');
    expect(stripped).not.toContain('as unknown');
    expect(stripped).not.toContain('as string');
    expect(() => new Function(stripped)).not.toThrow();
  });

  it('should preserve import * as and import/export clauses with as', () => {
    const input = `import * as path from 'path';\nimport { foo as bar } from './mod.js';\nexport { bar as baz };\nexport default { p: path };`;
    const stripped = stripTypeScript(input);
    expect(stripped).toContain('import * as path');
    expect(stripped).toContain('foo as bar');
    expect(stripped).toContain('bar as baz');
  });

  it('should not strip as inside string literals and comments', () => {
    const input = `// as Record<string, any>\nconst desc = "same as before";\nexport default { desc };`;
    const stripped = stripTypeScript(input);
    expect(stripped).toContain('"same as before"');
  });
});
