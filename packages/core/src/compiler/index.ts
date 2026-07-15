import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { Transformer } from './transformer.js';
import { Optimizer } from './optimizer.js';
import { CodeGenerator } from './codegen.js';
import { ASTNode } from './ast.js';

export interface CompileResult {
  code: string;
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
    const startParse = performance.now();
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const parseTimeMs = Number((performance.now() - startParse).toFixed(2));

    // Calculate node counts in AST
    let nodeCount = 0;
    const countNodes = (n: any) => {
      if (!n) return;
      nodeCount++;
      if (n.body && Array.isArray(n.body)) {
        n.body.forEach(countNodes);
      }
      if (n.declarations && Array.isArray(n.declarations)) {
        n.declarations.forEach(countNodes);
      }
      if (n.arguments && Array.isArray(n.arguments)) {
        n.arguments.forEach(countNodes);
      }
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

    const optimizer = new Optimizer();
    const optimizedAst = optimizer.optimize(transformedAst);
    const transformTimeMs = Number((performance.now() - startTransform).toFixed(2));

    const startEmit = performance.now();
    const codegen = new CodeGenerator(options.minify);
    const output = codegen.generate(optimizedAst);
    const emitTimeMs = Number((performance.now() - startEmit).toFixed(2));

    return {
      code: output,
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
