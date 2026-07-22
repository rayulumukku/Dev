import { DeploymentContext } from './types.js';

export function createDeploymentContext(projectRoot: string, outDir: string, adapterName: string, options: Partial<DeploymentContext> = {}): DeploymentContext {
  return {
    projectRoot,
    outDir,
    adapterName,
    ...options,
  };
}
