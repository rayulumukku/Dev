/**
 * Transforms JS/JSX/TS/TSX code using Ray's native compiler.
 * Drop-in replacement for the previous esbuild-based transformJsx().
 */
export declare function transformJsx(code: string, filename: string): Promise<string>;
/**
 * Async compile with full { code, map } output.
 */
export declare function transformFile(code: string, filename: string, options?: {
    minify?: boolean;
}): Promise<{
    code: string;
    map?: string;
}>;
//# sourceMappingURL=index.d.ts.map