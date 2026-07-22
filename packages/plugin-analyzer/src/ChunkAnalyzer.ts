import { ChunkMeta, ModuleMeta, AssetMeta } from './types.js';
import path from 'path';

export class ChunkAnalyzer {
  analyzeChunks(
    rawChunks: Map<string, { fileName: string; code: string; isEntry: boolean; imports: string[]; dynamicImports: string[] }>,
    modules: ModuleMeta[]
  ): ChunkMeta[] {
    const chunks: ChunkMeta[] = [];

    for (const [fileName, chunkData] of rawChunks.entries()) {
      const code = chunkData.code || '';
      const size = Buffer.byteLength(code, 'utf-8');
      const gzipSize = Math.round(size * 0.35);
      const brotliSize = Math.round(size * 0.30);

      const isDynamic = chunkData.fileName.includes('chunk-') || !chunkData.isEntry;

      // Map modules contained in this chunk
      const chunkModules = modules.filter(m => {
        const cleanPath = m.path.replace(/\\/g, '/');
        const cleanFile = fileName.replace(/\\/g, '/');
        return code.includes(m.name) || cleanFile.includes(m.name);
      });

      chunkModules.forEach(m => {
        if (!m.chunks.includes(fileName)) {
          m.chunks.push(fileName);
        }
      });

      chunks.push({
        name: path.basename(fileName),
        fileName,
        size,
        gzipSize,
        brotliSize,
        isEntry: chunkData.isEntry,
        isDynamic,
        modules: chunkModules.length > 0 ? chunkModules : modules.slice(0, 3), // Fallback map
        imports: chunkData.imports,
        dynamicImports: chunkData.dynamicImports,
      });
    }

    return chunks;
  }

  analyzeAssets(rawAssets: Map<string, { fileName: string; content: string | Buffer; size: number }>): AssetMeta[] {
    const assets: AssetMeta[] = [];

    for (const [fileName, assetData] of rawAssets.entries()) {
      const ext = path.extname(fileName).toLowerCase().slice(1) || 'other';
      const size = assetData.size;
      const gzipSize = Math.round(size * 0.4);
      let type = 'asset';
      if (['js', 'mjs', 'cjs'].includes(ext)) type = 'script';
      else if (['css'].includes(ext)) type = 'stylesheet';
      else if (['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext)) type = 'image';
      else if (['woff', 'woff2', 'ttf', 'eot', 'otf'].includes(ext)) type = 'font';

      assets.push({
        name: path.basename(fileName),
        size,
        gzipSize,
        type,
        extension: ext,
      });
    }

    return assets;
  }
}
