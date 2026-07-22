/**
 * Represents a single module in the dependency graph.
 */
export declare class ModuleNode {
    /** Unique module identifier (typically its absolute file path on disk) */
    id: string;
    /** Absolute file path on disk */
    file: string;
    /** Served URL path in the browser (e.g. /src/App.jsx or /@modules/react) */
    url: string;
    /** Modules that this module imports */
    dependencies: Set<ModuleNode>;
    /** Modules that import this module */
    importers: Set<ModuleNode>;
    /** Timestamp of the last time this module was compiled/transformed */
    lastTransformTime: number;
    /** Tracks whether the module accepts its own updates (HMR boundary) */
    isSelfAccepting: boolean;
    /** Incremental compilation state tracking */
    status: 'clean' | 'dirty' | 'rebuilding' | 'failed';
    /** Hash of file content when last compiled */
    hash: string;
    /** Cached abstract syntax tree (AST) object */
    ast: any;
    /** Cached transformed code and source map wrapper output */
    cachedOutput: {
        code: string;
        map?: any;
    } | null;
    constructor(id: string, file: string, url: string);
}
//# sourceMappingURL=moduleNode.d.ts.map