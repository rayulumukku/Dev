import { ASTNode } from './ast.js';
export declare class Scope {
    parent: Scope | null;
    bindings: Map<string, {
        node: ASTNode;
        referencesCount: number;
    }>;
    constructor(parent?: Scope | null);
    declare(name: string, node: ASTNode): void;
    reference(name: string): boolean;
    getBinding(name: string): {
        node: ASTNode;
        referencesCount: number;
    } | null;
}
export declare class ScopeAnalyzer {
    analyze(ast: ASTNode): Scope;
    private visit;
    /**
     * Declares all identifiers from a pattern (destructuring or simple identifier).
     */
    private declarePattern;
}
//# sourceMappingURL=scope.d.ts.map