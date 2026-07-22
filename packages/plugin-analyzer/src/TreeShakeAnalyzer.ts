import { ModuleMeta } from './types.js';

export class TreeShakeAnalyzer {
  calculateTreeShakingMetrics(modules: ModuleMeta[]): { deadCodeEstimate: number; treeShakenPercentage: number } {
    let totalRaw = 0;
    let totalTransformed = 0;
    let totalDead = 0;

    for (const m of modules) {
      totalRaw += m.size;
      totalTransformed += m.transformedSize;
      totalDead += m.deadBytesEstimate;
    }

    const deadCodeEstimate = totalDead;
    const treeShakenPercentage = totalRaw > 0
      ? Number(((totalDead / totalRaw) * 100).toFixed(1))
      : 0;

    return {
      deadCodeEstimate,
      treeShakenPercentage,
    };
  }
}
