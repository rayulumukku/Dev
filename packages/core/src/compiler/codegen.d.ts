import { ASTNode } from './ast.js';
export interface SourceMap {
    version: number;
    file: string;
    sources: string[];
    mappings: string;
    names: string[];
}
export declare class CodeGenerator {
    private minified;
    private currentLine;
    private currentCol;
    private mappings;
    constructor(minified?: boolean);
    private record;
    private emit;
    generateWithSourceMap(node: ASTNode, sourceFile: string): {
        code: string;
        map: SourceMap;
    };
    private encodeVLQ;
    generate(node: ASTNode): string;
    private generateImportAttributes;
}
//# sourceMappingURL=codegen.d.ts.map