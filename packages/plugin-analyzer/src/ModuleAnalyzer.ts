import { ModuleMeta } from './types.js';
import { RawModuleRecord } from './BundleCollector.js';
import path from 'path';

export class ModuleAnalyzer {
  analyzeModules(rawModules: Map<string, RawModuleRecord>): ModuleMeta[] {
    const modules: ModuleMeta[] = [];

    for (const [id, raw] of rawModules.entries()) {
      const isNodeModule = id.includes('node_modules');
      let packageName: string | undefined = undefined;
      let packageVersion: string | undefined = undefined;

      if (isNodeModule) {
        const parts = id.replace(/\\/g, '/').split('node_modules/');
        const pkgPath = parts[parts.length - 1];
        if (pkgPath.startsWith('@')) {
          const pkgParts = pkgPath.split('/');
          packageName = `${pkgParts[0]}/${pkgParts[1]}`;
        } else {
          packageName = pkgPath.split('/')[0];
        }
      }

      const size = raw.size || 1;
      const transformedSize = raw.transformedSize || size;
      const gzipSize = Math.round(transformedSize * 0.35); // Estimated gzip ratio
      const brotliSize = Math.round(transformedSize * 0.30); // Estimated brotli ratio

      const isTreeShaken = transformedSize < size;
      const deadBytesEstimate = Math.max(0, size - transformedSize);

      modules.push({
        id,
        name: path.basename(id),
        path: id,
        size,
        transformedSize,
        gzipSize,
        brotliSize,
        isNodeModule,
        packageName,
        packageVersion,
        chunks: [],
        isTreeShaken,
        deadBytesEstimate,
      });
    }

    return modules;
  }
}
