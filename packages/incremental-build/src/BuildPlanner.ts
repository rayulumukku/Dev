import { BuildManifest, BuildPlan, PlannedModule, InvalidationReason } from './types.js';
import { ChangeDetector } from './ChangeDetector.js';
import { AffectedGraph } from './AffectedGraph.js';

export class BuildPlanner {
  private changeDetector = new ChangeDetector();
  private affectedGraph = new AffectedGraph();

  createPlan(
    currentFiles: Record<string, string>,
    previousManifest: BuildManifest | null,
    context: {
      configHash: string;
      envHash: string;
      pluginsHash: string;
      rayVersion: string;
      graph?: any;
      forcedClean?: boolean;
    }
  ): BuildPlan {
    const modules = new Map<string, PlannedModule>();

    // Case 1: Forced clean or no previous manifest -> rebuild all
    if (context.forcedClean || !previousManifest) {
      for (const [filePath, code] of Object.entries(currentFiles)) {
        const hash = this.changeDetector.computeFileHash(filePath, code);
        modules.set(filePath, {
          filePath,
          state: 'rebuilt',
          reason: context.forcedClean ? 'forced-clean' : 'missing-artifact',
          hash,
        });
      }
      return {
        modules,
        reusedCount: 0,
        rebuiltCount: modules.size,
        invalidatedCount: 0,
        totalCount: modules.size,
        requiresCleanFallback: false,
        reason: context.forcedClean ? 'Clean build requested' : 'No previous manifest found',
      };
    }

    // Case 2: Config, Env, Plugins, or Ray version changed -> clean fallback required
    if (previousManifest.configHash !== context.configHash) {
      return this.fallbackClean(currentFiles, 'config-changed', 'Configuration changed');
    }
    if (previousManifest.envHash !== context.envHash) {
      return this.fallbackClean(currentFiles, 'env-changed', 'Environment variables changed');
    }
    if (previousManifest.pluginsHash !== context.pluginsHash) {
      return this.fallbackClean(currentFiles, 'plugin-changed', 'Plugins configuration changed');
    }
    if (previousManifest.version !== context.rayVersion) {
      return this.fallbackClean(currentFiles, 'version-changed', 'Ray version changed');
    }

    // Case 3: Identify direct content changes
    const directlyChanged = new Set<string>();

    for (const [filePath, code] of Object.entries(currentFiles)) {
      const currentHash = this.changeDetector.computeFileHash(filePath, code);
      const prevFile = previousManifest.files[filePath];

      if (!prevFile || prevFile.hash !== currentHash) {
        directlyChanged.add(filePath);
      }
    }

    // Identify deleted files
    for (const prevPath of Object.keys(previousManifest.files)) {
      if (!(prevPath in currentFiles)) {
        directlyChanged.add(prevPath);
      }
    }

    // Traverse affected graph
    const affectedSet = this.affectedGraph.computeAffected(directlyChanged, context.graph);

    let reusedCount = 0;
    let rebuiltCount = 0;
    let invalidatedCount = 0;

    for (const [filePath, code] of Object.entries(currentFiles)) {
      const hash = this.changeDetector.computeFileHash(filePath, code);

      if (directlyChanged.has(filePath)) {
        modules.set(filePath, { filePath, state: 'affected', reason: 'file-changed', hash });
        rebuiltCount++;
      } else if (affectedSet.has(filePath)) {
        modules.set(filePath, { filePath, state: 'invalidated', reason: 'dep-changed', hash });
        invalidatedCount++;
      } else {
        modules.set(filePath, { filePath, state: 'reused', hash });
        reusedCount++;
      }
    }

    return {
      modules,
      reusedCount,
      rebuiltCount,
      invalidatedCount,
      totalCount: modules.size,
      requiresCleanFallback: false,
    };
  }

  private fallbackClean(currentFiles: Record<string, string>, reason: InvalidationReason, message: string): BuildPlan {
    const modules = new Map<string, PlannedModule>();
    for (const [filePath, code] of Object.entries(currentFiles)) {
      const hash = this.changeDetector.computeFileHash(filePath, code);
      modules.set(filePath, { filePath, state: 'rebuilt', reason, hash });
    }
    return {
      modules,
      reusedCount: 0,
      rebuiltCount: modules.size,
      invalidatedCount: 0,
      totalCount: modules.size,
      requiresCleanFallback: true,
      reason: message,
    };
  }
}
