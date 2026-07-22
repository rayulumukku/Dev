/**
 * ChunkMerger
 *
 * Deterministically merges an ordered array of compiled module chunks
 * (each with { file, code, map }) into a single concatenated bundle and
 * a combined source map index that maps offsets back to the original files.
 *
 * Satisfies: Deterministic · Cacheable · Zero Global State
 */
export interface CompiledChunk {
    file: string;
    code: string;
    map?: string | object;
}
export interface MergeResult {
    code: string;
    /** JSON-stringified source map index (sections format, RFC 5.4) */
    map: string;
    /** Byte-offset at which each chunk begins in the merged output */
    chunkOffsets: Record<string, number>;
}
export declare class ChunkMerger {
    /**
     * Merges chunks in the order provided. Each chunk is separated by a
     * synthetic comment banner so the result is human-readable and debuggable.
     */
    merge(chunks: CompiledChunk[]): MergeResult;
    /**
     * Splits merged bundle back into per-file slices using the banners —
     * useful for diagnostics and debugging.
     */
    split(mergedCode: string): Record<string, string>;
}
//# sourceMappingURL=chunkMerger.d.ts.map