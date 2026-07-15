/**
 * @ray/compiler-rust
 *
 * NAPI-RS bridge that routes expensive compiler stages through native Rust binaries.
 * If the binary is unavailable (e.g. Rust toolchain not installed, pre-build not run),
 * this module transparently falls back to the pure TypeScript compiler engine so the
 * JavaScript-facing API remains 100% unchanged.
 *
 * Pipeline:
 *   TypeScript/JSX/TSX source
 *     → [Rust] Lexer.tokenize()
 *     → [Rust] Parser.parse()       → AST
 *     → [Rust] Optimizer.optimize() → AST
 *     → JS    Plugin hooks           → AST
 *     → [Rust] Codegen.generate()   → { code, map }
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const _require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Types: mirror the JS compiler interfaces for type safety in both paths
// ---------------------------------------------------------------------------

export interface RustToken {
  type: string;
  value: string;
  line: number;
  column: number;
}

export interface RustASTNode {
  type: string;
  [key: string]: any;
}

export interface RustCodegenResult {
  code: string;
  map: string;
}

export interface IRustCompilerBridge {
  lexerTokenize(code: string): string;   // Returns JSON-encoded RustToken[]
  parserParse(tokensJson: string): string;   // Returns JSON-encoded RustASTNode
  optimizerOptimize(astJson: string): string; // Returns JSON-encoded RustASTNode
  codegenGenerate(astJson: string): string;   // Returns JSON-encoded RustCodegenResult
}

// ---------------------------------------------------------------------------
// Attempt to load the pre-compiled native binary
// ---------------------------------------------------------------------------

let _native: IRustCompilerBridge | null = null;
let _rustAvailable = false;

try {
  // NAPI-RS emits a .node binary in the package root.
  // Typical output path after `napi build --release`:
  //   packages/compiler-rust/ray-compiler-rust.win32-x64-msvc.node
  const nativePath = path.join(__dirname, '..', 'ray-compiler-rust.node');
  _native = _require(nativePath) as IRustCompilerBridge;
  _rustAvailable = true;
  console.log('[Ray Compiler] ⚡ Rust compiler backend loaded successfully.');
} catch {
  console.warn(
    '[Ray Compiler] ⚠️  Rust binary not found. Falling back to TypeScript compiler engine. ' +
    'Run `cargo build --release` inside packages/compiler-rust to enable the native backend.'
  );
}

// ---------------------------------------------------------------------------
// JavaScript fallback engine — imports Ray's own TS compiler classes
// ---------------------------------------------------------------------------

/**
 * Lazy-loaded JS fallback module. We import dynamically so that modules that
 * ONLY use the Rust paths never pay the cost of loading the TS engine.
 */
let _jsFallback: {
  Lexer: any;
  Parser: any;
  Optimizer: any;
  CodeGenerator: any;
} | null = null;

async function getJsFallback() {
  if (_jsFallback) return _jsFallback;
  // Resolve the core compiler entry relative to this package.
  // In the monorepo the compiled JS is at:
  //   packages/core/dist/compiler/lexer.js  etc.
  const base = path.join(__dirname, '../../core/dist/compiler');
  // Build explicit file:// URLs from resolved disk paths so Vite/Node does not
  // misinterpret template-literal URL patterns during static analysis.
  const toFileUrl = (p: string) => new URL('file:///' + p.replace(/\\/g, '/')).href;
  const [{ Lexer }, { Parser }, { Optimizer }, { CodeGenerator }] = await Promise.all([
    import(/* @vite-ignore */ toFileUrl(path.join(base, 'lexer.js'))),
    import(/* @vite-ignore */ toFileUrl(path.join(base, 'parser.js'))),
    import(/* @vite-ignore */ toFileUrl(path.join(base, 'optimizer.js'))),
    import(/* @vite-ignore */ toFileUrl(path.join(base, 'codegen.js'))),
  ]);
  _jsFallback = { Lexer, Parser, Optimizer, CodeGenerator };
  return _jsFallback;
}

// ---------------------------------------------------------------------------
// Public API — same surface whether Rust or JS is driving the pipeline
// ---------------------------------------------------------------------------

/**
 * Returns true when the native Rust binary is active.
 */
export function isRustBackendActive(): boolean {
  return _rustAvailable;
}

/**
 * Stage 1 — Lexer
 * Tokenise source code into a structured token stream.
 * Returns a JSON string of RustToken[] (or equivalent JS token objects).
 */
export async function lexerTokenize(code: string): Promise<RustToken[]> {
  if (_native) {
    const raw = _native.lexerTokenize(code);
    return JSON.parse(raw) as RustToken[];
  }
  const { Lexer } = await getJsFallback();
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  // Normalise JS Token objects to the RustToken shape.
  return tokens.map((t: any) => ({
    type: t.type,
    value: t.value,
    line: t.line ?? 0,
    column: t.column ?? 0,
  }));
}

/**
 * Stage 2 — Parser
 * Parse a token stream into an AST.
 * Accepts either a RustToken[] array or a pre-serialised JSON string.
 */
export async function parserParse(tokensOrCode: RustToken[] | string): Promise<RustASTNode> {
  if (_native) {
    const tokensJson = typeof tokensOrCode === 'string'
      ? tokensOrCode
      : JSON.stringify(tokensOrCode);
    return JSON.parse(_native.parserParse(tokensJson)) as RustASTNode;
  }
  const { Lexer, Parser } = await getJsFallback();
  // If we received raw source (string) instead of tokens we re-lex.
  let tokens: any[];
  if (typeof tokensOrCode === 'string') {
    tokens = new Lexer(tokensOrCode).tokenize();
  } else {
    tokens = tokensOrCode;
  }
  const parser = new Parser(tokens);
  return parser.parse() as RustASTNode;
}

/**
 * Stage 3 — Optimizer
 * Apply scope analysis, tree-shaking, and constant folding to an AST.
 */
export async function optimizerOptimize(ast: RustASTNode): Promise<RustASTNode> {
  if (_native) {
    const astJson = JSON.stringify(ast);
    return JSON.parse(_native.optimizerOptimize(astJson)) as RustASTNode;
  }
  const { Optimizer } = await getJsFallback();
  const optimizer = new Optimizer();
  return optimizer.optimize(ast) as RustASTNode;
}

/**
 * Stage 4 — Code Generator
 * Emit JavaScript source + source map from an AST.
 */
export async function codegenGenerate(
  ast: RustASTNode,
  filename: string,
  minify = false
): Promise<RustCodegenResult> {
  if (_native) {
    const astJson = JSON.stringify({ ast, filename, minify });
    return JSON.parse(_native.codegenGenerate(astJson)) as RustCodegenResult;
  }
  const { CodeGenerator } = await getJsFallback();
  const codegen = new CodeGenerator(minify);
  const { code, map } = codegen.generateWithSourceMap(ast, filename);
  return {
    code,
    map: typeof map === 'string' ? map : JSON.stringify(map),
  };
}

/**
 * Full compiler pipeline convenience function.
 * Lexes → Parses → Optimizes → Generates code in one call.
 */
export async function compile(
  code: string,
  filename: string,
  options: { minify?: boolean } = {}
): Promise<{ code: string; map: string; tokensCount: number; backend: 'rust' | 'js' }> {
  const tokens = await lexerTokenize(code);
  const ast = await parserParse(tokens);
  const optimizedAst = await optimizerOptimize(ast);
  const result = await codegenGenerate(optimizedAst, filename, options.minify ?? false);
  return {
    ...result,
    tokensCount: tokens.length,
    backend: _rustAvailable ? 'rust' : 'js',
  };
}

export default { compile, lexerTokenize, parserParse, optimizerOptimize, codegenGenerate, isRustBackendActive };
