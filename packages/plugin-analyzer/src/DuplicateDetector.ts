import { ModuleMeta, DuplicatedPackage } from './types.js';

export class DuplicateDetector {
  detectDuplicates(modules: ModuleMeta[]): DuplicatedPackage[] {
    const pkgMap = new Map<string, { versions: Set<string>; count: number; totalSize: number }>();

    for (const m of modules) {
      if (m.isNodeModule && m.packageName) {
        const pkgName = m.packageName;
        const version = m.packageVersion || '1.0.0';
        const existing = pkgMap.get(pkgName);

        if (existing) {
          existing.versions.add(version);
          existing.count += 1;
          existing.totalSize += m.transformedSize;
        } else {
          pkgMap.set(pkgName, {
            versions: new Set([version]),
            count: 1,
            totalSize: m.transformedSize,
          });
        }
      }
    }

    const duplicates: DuplicatedPackage[] = [];

    for (const [name, data] of pkgMap.entries()) {
      if (data.versions.size > 1 || data.count > 3) {
        duplicates.push({
          name,
          versions: Array.from(data.versions),
          count: data.count,
          totalSize: data.totalSize,
        });
      }
    }

    return duplicates;
  }
}
