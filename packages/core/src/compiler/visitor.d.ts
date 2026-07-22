import { ASTNode } from './ast.js';
export type VisitorCallback = (node: ASTNode, parent: ASTNode | null) => ASTNode | null | ASTNode[];
export interface VisitorHooks {
    enter?: VisitorCallback;
    leave?: VisitorCallback;
    [nodeType: string]: VisitorCallback | VisitorHooks[keyof VisitorHooks] | undefined;
}
export declare class ASTVisitor {
    private hooks;
    constructor(hooks: VisitorHooks);
    traverse(node: ASTNode, parent?: ASTNode | null): ASTNode | null | ASTNode[];
    private traverseList;
}
//# sourceMappingURL=visitor.d.ts.map