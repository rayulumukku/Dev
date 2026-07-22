/**
 * Parses an import specifier into its package name and subpath.
 * E.g., 'react' -> { packageName: 'react', subpath: '.' }
 * E.g., 'react-dom/client' -> { packageName: 'react-dom', subpath: './client' }
 * E.g., '@babel/core/preset' -> { packageName: '@babel/core', subpath: './preset' }
 */
export declare function parseSpecifier(specifier: string): {
    packageName: string;
    subpath: string;
};
/**
 * Resolves conditional exports based on client ESM preferences.
 */
export declare function resolveConditionalExports(exportsValue: any, importType?: string): string | null;
export declare class Resolver {
    projectRoot: string;
    resolutionCache: Map<string, string>;
    constructor(projectRoot: string);
    /**
     * Resolves a bare package specifier (e.g. 'react', 'react-dom/client') to its absolute file path.
     * Uses standard Node-style node_modules lookup starting from the importer directory.
     * If specifier starts with '#', resolves via the `imports` field in the nearest package.json.
     */
    resolveBarePackage(specifier: string, startDir: string, importType?: string): string;
    /**
     * Recursively finds node_modules/<packageName> walking up from the start directory.
     */
    private findPackageDir;
    /**
     * Resolves '#subpath' imports using the `imports` field from the nearest package.json.
     * Per Node.js subpath imports specification.
     */
    private resolveSubpathImport;
    /**
     * Resolves extension-less paths or directories containing index files.
     */
    private ensureFile;
}
//# sourceMappingURL=index.d.ts.map