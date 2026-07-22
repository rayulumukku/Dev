import { DeploymentContext, DeploymentPlan } from './types.js';
import { BuildArtifactCollector } from './BuildArtifactCollector.js';

export class DeploymentPlanner {
  static createPlan(ctx: DeploymentContext): DeploymentPlan {
    const artifacts = BuildArtifactCollector.collectArtifacts(ctx.outDir);
    return {
      adapter: ctx.adapterName,
      runtimeTargets: ['static', 'node'],
      assets: artifacts.assets,
      staticFiles: artifacts.staticFiles,
      serverBundles: artifacts.serverBundles,
      planTime: Date.now(),
    };
  }
}
