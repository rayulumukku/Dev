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

export class ChunkMerger {
  /**
   * Merges chunks in the order provided. Each chunk is separated by a
   * synthetic comment banner so the result is human-readable and debuggable.
   */
  merge(chunks: CompiledChunk[]): MergeResult {
    const sections: Array<{ offset: { line: number; column: number }; map: object }> = [];
    const parts: string[] = [];
    const chunkOffsets: Record<string, number> = {};

    let currentLine = 0;
    let currentOffset = 0;

    for (const chunk of chunks) {
      const banner = `/* [Ray Chunk] ${chunk.file} */\n`;
      parts.push(banner);
      currentLine += 1;
      currentOffset += banner.length;

      chunkOffsets[chunk.file] = currentOffset;

      // Parse existing source map if available
      let chunkMap: object | null = null;
      if (chunk.map) {
        try {
          chunkMap = typeof chunk.map === 'string' ? JSON.parse(chunk.map) : chunk.map;
        } catch {
          chunkMap = null;
        }
      }

      if (chunkMap) {
        sections.push({
          offset: { line: currentLine, column: 0 },
          map: chunkMap,
        });
      }

      parts.push(chunk.code);
      const chunkLines = chunk.code.split('\n').length;
      currentLine += chunkLines;
      currentOffset += chunk.code.length;

      // Trailing newline between chunks
      parts.push('\n');
      currentLine += 1;
      currentOffset += 1;
    }

    const merged = parts.join('');

    const indexMap = {
      version: 3,
      file: 'bundle.js',
      sections,
    };

    return {
      code: merged,
      map: JSON.stringify(indexMap),
      chunkOffsets,
    };
  }

  /**
   * Splits merged bundle back into per-file slices using the banners —
   * useful for diagnostics and debugging.
   */
  split(mergedCode: string): Record<string, string> {
    const result: Record<string, string> = {};
    const bannerRe = /\/\* \[Ray Chunk\] (.+?) \*\/\n/g;
    let match: RegExpExecArray | null;
    const positions: Array<{ file: string; index: number }> = [];

    while ((match = bannerRe.exec(mergedCode)) !== null) {
      positions.push({ file: match[1], index: match.index + match[0].length });
    }

    for (let i = 0; i < positions.length; i++) {
      const start = positions[i].index;
      const end = i + 1 < positions.length ? positions[i + 1].index - positions[i + 1].file.length - 20 : mergedCode.length;
      result[positions[i].file] = mergedCode.slice(start, end).trimEnd();
    }

    return result;
  }
}
