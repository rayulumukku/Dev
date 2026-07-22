import { ModuleMeta, ChunkMeta, AssetMeta } from './types.js';
import path from 'path';

export interface RawModuleRecord {
  id: string;
  code: string;
  transformedCode?: string;
  size: number;
  transformedSize: number;
}

export class BundleCollector {
  private modulesMap = new Map<string, RawModuleRecord>();
  private chunksMap = new Map<string, { fileName: string; code: string; isEntry: boolean; imports: string[]; dynamicImports: string[] }>();
  private assetsMap = new Map<string, { fileName: string; content: string | Buffer; size: number }>();

  recordModule(id: string, code: string, transformedCode?: string) {
    const rawSize = Buffer.byteLength(code || '', 'utf-8');
    const transformedSize = Buffer.byteLength(transformedCode || code || '', 'utf-8');

    const existing = this.modulesMap.get(id);
    if (existing) {
      existing.transformedCode = transformedCode || existing.transformedCode;
      existing.transformedSize = transformedSize;
    } else {
      this.modulesMap.set(id, {
        id,
        code,
        transformedCode: transformedCode || code,
        size: rawSize,
        transformedSize,
      });
    }
  }

  recordChunk(fileName: string, code: string, options: { isEntry?: boolean; imports?: string[]; dynamicImports?: string[] } = {}) {
    this.chunksMap.set(fileName, {
      fileName,
      code: code || '',
      isEntry: !!options.isEntry,
      imports: options.imports || [],
      dynamicImports: options.dynamicImports || [],
    });
  }

  recordAsset(fileName: string, content: string | Buffer) {
    const size = typeof content === 'string' ? Buffer.byteLength(content, 'utf-8') : content.length;
    this.assetsMap.set(fileName, { fileName, content, size });
  }

  getModules(): Map<string, RawModuleRecord> {
    return this.modulesMap;
  }

  getChunks() {
    return this.chunksMap;
  }

  getAssets() {
    return this.assetsMap;
  }

  clear() {
    this.modulesMap.clear();
    this.chunksMap.clear();
    this.assetsMap.clear();
  }
}
