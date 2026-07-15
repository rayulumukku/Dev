import { describe, it, expect } from 'vitest';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Rust Compiler Bridge Tests', () => {
  it('should export all required functions from the bridge module', async () => {
    const bridge = await import('../../packages/compiler-rust/src/index.js');
    expect(typeof bridge.lexerTokenize).toBe('function');
    expect(typeof bridge.parserParse).toBe('function');
    expect(typeof bridge.optimizerOptimize).toBe('function');
    expect(typeof bridge.codegenGenerate).toBe('function');
    expect(typeof bridge.compile).toBe('function');
    expect(typeof bridge.isRustBackendActive).toBe('function');
  });

  it('should report whether the Rust backend is active (either true or false)', async () => {
    const { isRustBackendActive } = await import('../../packages/compiler-rust/src/index.js');
    const active = isRustBackendActive();
    expect(typeof active).toBe('boolean');
    // Likely false in this environment (no Rust toolchain), which is fine.
    console.log(`[Test] Rust backend active: ${active}`);
  });

  it('should tokenize JavaScript source code via the bridge (falls back to JS lexer)', async () => {
    const { lexerTokenize } = await import('../../packages/compiler-rust/src/index.js');
    const code = `const x = 1 + 2;`;
    const tokens = await lexerTokenize(code);
    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
    // Every token should have type, value, line, column fields
    for (const tok of tokens) {
      expect(tok).toHaveProperty('type');
      expect(tok).toHaveProperty('value');
      expect(tok).toHaveProperty('line');
      expect(tok).toHaveProperty('column');
    }
  });

  it('should parse a token stream into an AST via the bridge (falls back to JS parser)', async () => {
    const { lexerTokenize, parserParse } = await import('../../packages/compiler-rust/src/index.js');
    const code = `const greeting = "hello";`;
    const tokens = await lexerTokenize(code);
    const ast = await parserParse(tokens);
    expect(ast).toBeDefined();
    expect(ast.type).toBe('Program');
  });

  it('should optimize an AST via the bridge (falls back to JS optimizer)', async () => {
    const { lexerTokenize, parserParse, optimizerOptimize } = await import(
      '../../packages/compiler-rust/src/index.js'
    );
    const code = `const alive = true;\nconst dead = false;`;
    const tokens = await lexerTokenize(code);
    const ast = await parserParse(tokens);
    const optimized = await optimizerOptimize(ast);
    expect(optimized).toBeDefined();
    expect(optimized.type).toBe('Program');
  });

  it('should generate code from an AST via the bridge (falls back to JS codegen)', async () => {
    const { lexerTokenize, parserParse, optimizerOptimize, codegenGenerate } = await import(
      '../../packages/compiler-rust/src/index.js'
    );
    const code = `export const value = 42;`;
    const tokens = await lexerTokenize(code);
    const ast = await parserParse(tokens);
    const optimized = await optimizerOptimize(ast);
    const result = await codegenGenerate(optimized, 'test.js');
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('map');
    expect(typeof result.code).toBe('string');
    expect(result.code.length).toBeGreaterThan(0);
  });

  it('should run the full compile() pipeline and report the backend used', async () => {
    const { compile } = await import('../../packages/compiler-rust/src/index.js');
    const code = `const answer = 40 + 2;\nexport default answer;`;
    const result = await compile(code, 'answer.js');
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('map');
    expect(result).toHaveProperty('tokensCount');
    expect(result).toHaveProperty('backend');
    expect(['rust', 'js']).toContain(result.backend);
    expect(result.tokensCount).toBeGreaterThan(0);
    console.log(`[Test] compile() backend: ${result.backend}, tokens: ${result.tokensCount}`);
  });
});
