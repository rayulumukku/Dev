import { ASTNode } from './ast.js';
export interface TransformerOptions {
    /** JSX runtime: 'classic' uses React.createElement, 'automatic' uses jsx/jsxs from react/jsx-runtime */
    jsxRuntime?: 'classic' | 'automatic';
    /** JSX import source (default: 'react') */
    jsxImportSource?: string;
    /** Enable React Compiler compatibility mode */
    reactCompiler?: boolean;
    /** Lower decorators to helper calls */
    lowerDecorators?: boolean;
    /** Lower `using` declarations to try/finally + Symbol.dispose */
    lowerUsing?: boolean;
}
export declare class Transformer {
    private env;
    private options;
    private needsJsxImport;
    private needsJsxsImport;
    private needsFragmentImport;
    private needsDisposeHelper;
    constructor(env?: Record<string, string>, options?: TransformerOptions);
    transform(node: ASTNode): ASTNode;
    private visit;
    private transformJSX;
    private transformJSXClassic;
    private transformJSXAutomatic;
    private transformJSXFragment;
    private lowerClassDecorators;
    private lowerUsingDeclaration;
    private flattenMemberExpression;
}
//# sourceMappingURL=transformer.d.ts.map