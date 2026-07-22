import { DeploymentContext, DeploymentPlan } from './types.js';

export class DeploymentManifest {
  static generateManifest(ctx: DeploymentContext, plan: DeploymentPlan): Record<string, any> {
    return {
      adapter: ctx.adapterName,
      created: new Date().toISOString(),
      plan,
    };
  }
}
