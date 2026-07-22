import { SourceMap } from './codegen.js';
import { ASTNode } from './ast.js';
export interface CompileResult {
    code: string;
    map: SourceMap;
    ast: ASTNode;
    astNodesCount: number;
    parseTimeMs: number;
    transformTimeMs: number;
    emitTimeMs: number;
}
export declare class RayCompiler {
    private env;
    constructor(env?: Record<string, string>);
    compile(code: string, file: string, options?: {
        minify?: boolean;
    }): CompileResult;
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
//# sourceMappingURL=index.d.ts.map