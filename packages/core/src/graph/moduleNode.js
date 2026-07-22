/**
 * Represents a single module in the dependency graph.
 */
export class ModuleNode {
    /** Unique module identifier (typically its absolute file path on disk) */
    id;
    /** Absolute file path on disk */
    file;
    /** Served URL path in the browser (e.g. /src/App.jsx or /@modules/react) */
    url;
    /** Modules that this module imports */
    dependencies = new Set();
    /** Modules that import this module */
    importers = new Set();
    /** Timestamp of the last time this module was compiled/transformed */
    lastTransformTime = 0;
    /** Tracks whether the module accepts its own updates (HMR boundary) */
    isSelfAccepting = false;
    /** Incremental compilation state tracking */
    status = 'dirty';
    /** Hash of file content when last compiled */
    hash = '';
    /** Cached abstract syntax tree (AST) object */
    ast = null;
    /** Cached transformed code and source map wrapper output */
    cachedOutput = null;
    constructor(id, file, url) {
        this.id = id;
        this.file = file;
        this.url = url;
    }
}
//# sourceMappingURL=moduleNode.js.map