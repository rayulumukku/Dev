import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Transformer } from './transformer.js';
import { Optimizer } from './optimizer.js';
import { CodeGenerator, SourceMap } from './codegen.js';
import { ASTNode } from './ast.js';

import { createRequire } from 'module';

// Attempt to load the Rust compiler bridge via the pre-built NAPI binary.
// Falls back transparently to null (pure JS) when Rust toolchain / binary unavailable.
let _rustBridge: {
  isRustBackendActive(): boolean;
  optimizerOptimizeSync?(astJson: string): string;
  codegenGenerateSync?(payload: string): string;
} | null = null;
try {
  const req = createRequire(import.meta.url);
  _rustBridge = req('@ray/compiler-rust/dist/index.js');
} catch {
  // Rust binary or package not yet available – pure JS pipeline will be used.
}

export interface CompileResult {
  code: string;
  map: SourceMap;
  ast: ASTNode;
  astNodesCount: number;
  parseTimeMs: number;
  transformTimeMs: number;
  emitTimeMs: number;
}

export class RayCompiler {
  private env: Record<string, string>;

  constructor(env: Record<string, string> = {}) {
    this.env = env;
  }

  compile(code: string, file: string, options: { minify?: boolean } = {}): CompileResult {
    // -----------------------------------------------------------------------
    // JS-only fallback pipeline (always available)
    // -----------------------------------------------------------------------
    const startParse = performance.now();
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const parseTimeMs = Number((performance.now() - startParse).toFixed(2));

    let nodeCount = 0;
    const countNodes = (n: any) => {
      if (!n) return;
      nodeCount++;
      if (n.body && Array.isArray(n.body)) n.body.forEach(countNodes);
      if (n.declarations && Array.isArray(n.declarations)) n.declarations.forEach(countNodes);
      if (n.arguments && Array.isArray(n.arguments)) n.arguments.forEach(countNodes);
      if (n.consequent) countNodes(n.consequent);
      if (n.alternate) countNodes(n.alternate);
      if (n.init) countNodes(n.init);
      if (n.left) countNodes(n.left);
      if (n.right) countNodes(n.right);
    };
    countNodes(ast);

    const startTransform = performance.now();
    const transformer = new Transformer(this.env);
    const transformedAst = transformer.transform(ast);

    // -----------------------------------------------------------------------
    // Optimizer — prefer Rust backend when available
    // -----------------------------------------------------------------------
    let optimizedAst: ASTNode;
    if (_rustBridge && (_rustBridge as any).isRustBackendActive?.()) {
      // Rust optimizer: synchronous JSON round-trip via native binding.
      // The Rust optimizer operates on the JSON-serialized AST and returns
      // an optimized AST that is fully compatible with our TS ASTNode shape.
      try {
        const astJson = JSON.stringify(transformedAst);
        const optimizedJson = (_rustBridge as any).optimizerOptimizeSync
          ? (_rustBridge as any).optimizerOptimizeSync(astJson)
          : JSON.stringify(transformedAst); // safe fallback if sync API unavailable
        optimizedAst = JSON.parse(optimizedJson) as ASTNode;
        console.log(`[Ray Compiler] ⚡ Rust optimizer active for ${file}`);
      } catch {
        // If Rust optimizer throws, fall back to JS optimizer silently.
        const optimizer = new Optimizer();
        optimizedAst = optimizer.optimize(transformedAst);
      }
    } else {
      const optimizer = new Optimizer();
      optimizedAst = optimizer.optimize(transformedAst);
    }
    const transformTimeMs = Number((performance.now() - startTransform).toFixed(2));

    // -----------------------------------------------------------------------
    // Code Generator — prefer Rust backend when available
    // -----------------------------------------------------------------------
    let output: string;
    let map: SourceMap;

    if (_rustBridge && (_rustBridge as any).isRustBackendActive?.()) {
      try {
        const payload = JSON.stringify({ ast: optimizedAst, filename: file, minify: options.minify ?? false });
        const resultJson = (_rustBridge as any).codegenGenerateSync
          ? (_rustBridge as any).codegenGenerateSync(payload)
          : null;
        if (resultJson) {
          const result = JSON.parse(resultJson);
          output = result.code;
          map = typeof result.map === 'string' ? JSON.parse(result.map) : result.map;
          console.log(`[Ray Compiler] ⚡ Rust codegen active for ${file}`);
        } else {
          throw new Error('Rust codegen sync not available');
        }
      } catch {
        const codegen = new CodeGenerator(options.minify);
        ({ code: output, map } = codegen.generateWithSourceMap(optimizedAst, file));
      }
    } else {
      const codegen = new CodeGenerator(options.minify);
      ({ code: output, map } = codegen.generateWithSourceMap(optimizedAst, file));
    }

    const emitTimeMs = Number((performance.now() - performance.now()).toFixed(2));

    return {
      code: output,
      map,
      ast: optimizedAst,
      astNodesCount: nodeCount,
      parseTimeMs,
      transformTimeMs,
      emitTimeMs
    };
  }
}
export { Lexer } from './lexer.js';
export { Parser } from './parser.js';
export { Transformer } from './transformer.js';
export { Optimizer } from './optimizer.js';
export { CodeGenerator } from './codegen.js';
export * from './ast.js';
export * from './lexer.js';
export { ASTVisitor } from './visitor.js';
export { Scope, ScopeAnalyzer } from './scope.js';
export { transformCjsToEsm } from './cjsTransform.js';
