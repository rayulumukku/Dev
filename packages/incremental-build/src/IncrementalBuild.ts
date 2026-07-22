import {
  IncrementalBuildOptions,
  BuildPlan,
  BuildManifest,
  IncrementalMetrics,
} from './types.js';
import { ChangeDetector } from './ChangeDetector.js';
import { BuildPlanner } from './BuildPlanner.js';
import { ArtifactStore } from './ArtifactStore.js';
import { OutputValidator } from './OutputValidator.js';
import crypto from 'crypto';

let _lastMetrics: IncrementalMetrics = {
  reusedArtifacts: 0,
  rebuiltArtifacts: 0,
  cacheHitRatio: 0,
  timeSavedMs: 0,
  invalidationReasons: {},
};

export class IncrementalBuildEngine {
  private changeDetector = new ChangeDetector();
  private buildPlanner = new BuildPlanner();
  private artifactStore: ArtifactStore;
  private outputValidator = new OutputValidator();
  private projectRoot: string;
  private options: IncrementalBuildOptions;

  constructor(options: IncrementalBuildOptions = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.options = options;
    this.artifactStore = new ArtifactStore(this.projectRoot, options.cacheDir);
  }

  plan(
    currentFiles: Record<string, string>,
    context: {
      config?: any;
      env?: Record<string, string>;
      plugins?: any[];
      rayVersion?: string;
      graph?: any;
    }
  ): BuildPlan {
    const startTime = Date.now();

    if (this.options.clean) {
      this.artifactStore.clear();
    }

    const previousManifest = this.artifactStore.loadManifest();

    const configHash = this.changeDetector.computeConfigHash(context.config);
    const envHash = this.changeDetector.computeEnvHash(context.env || {});
    const pluginsHash = this.changeDetector.computePluginsHash(context.plugins || []);
    const rayVersion = context.rayVersion || '1.0.0';

    const plan = this.buildPlanner.createPlan(currentFiles, previousManifest, {
      configHash,
      envHash,
      pluginsHash,
      rayVersion,
      graph: context.graph,
      forcedClean: !!this.options.clean,
    });

    // Validate previous output artifacts if validateOutputs is true
    if (this.options.validateOutputs && previousManifest && !plan.requiresCleanFallback) {
      const outDir = this.options.outDir || 'dist';
      const valRes = this.outputValidator.validateOutput(outDir, previousManifest);
      if (!valRes.valid) {
        // Output mismatch detected -> force clean fallback
        console.warn(`[Ray Incremental] Output validation mismatch detected. Falling back to clean build. Reasons: ${valRes.mismatches.join(', ')}`);
        return this.buildPlanner.createPlan(currentFiles, null, {
          configHash,
          envHash,
          pluginsHash,
          rayVersion,
          graph: context.graph,
          forcedClean: true,
        });
      }
    }

    // Record metrics
    const hitRatio = plan.totalCount > 0 ? Number(((plan.reusedCount / plan.totalCount) * 100).toFixed(1)) : 0;
    const timeSaved = Math.round(plan.reusedCount * 15); // Average 15ms saved per reused file

    const reasons: Record<string, number> = {};
    for (const [, p] of plan.modules) {
      if (p.reason) {
        reasons[p.reason] = (reasons[p.reason] || 0) + 1;
      }
    }

    _lastMetrics = {
      reusedArtifacts: plan.reusedCount,
      rebuiltArtifacts: plan.rebuiltCount,
      cacheHitRatio: hitRatio,
      timeSavedMs: timeSaved,
      invalidationReasons: reasons,
    };

    return plan;
  }

  saveBuildManifest(
    currentFiles: Record<string, string>,
    artifacts: Record<string, { content: string | Buffer; path: string }>,
    context: {
      config?: any;
      env?: Record<string, string>;
      plugins?: any[];
      rayVersion?: string;
    }
  ): BuildManifest {
    const configHash = this.changeDetector.computeConfigHash(context.config);
    const envHash = this.changeDetector.computeEnvHash(context.env || {});
    const pluginsHash = this.changeDetector.computePluginsHash(context.plugins || []);

    const filesManifest: Record<string, any> = {};
    for (const [filePath, code] of Object.entries(currentFiles)) {
      filesManifest[filePath] = {
        filePath,
        hash: this.changeDetector.computeFileHash(filePath, code),
        mtime: Date.now(),
        deps: [],
      };
    }

    const artifactMeta: Record<string, any> = {};
    for (const [artKey, item] of Object.entries(artifacts)) {
      const buf = typeof item.content === 'string' ? Buffer.from(item.content) : item.content;
      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      artifactMeta[artKey] = {
        hash,
        size: buf.length,
        path: item.path,
      };
      this.artifactStore.saveArtifact(artKey, buf);
    }

    const manifest: BuildManifest = {
      version: context.rayVersion || '1.0.0',
      timestamp: Date.now(),
      configHash,
      envHash,
      pluginsHash,
      files: filesManifest,
      artifacts: artifactMeta,
      chunkGraphHash: crypto.createHash('sha256').update(JSON.stringify(artifactMeta)).digest('hex'),
    };

    this.artifactStore.saveManifest(manifest);
    return manifest;
  }

  clean(): void {
    this.artifactStore.clear();
  }

  static getLastMetrics(): IncrementalMetrics {
    return _lastMetrics;
  }
}
