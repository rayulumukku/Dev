export interface DeploymentConfig {
  adapter?: string;
  output?: string;
  validate?: boolean;
}

export interface DeploymentCapabilities {
  static: boolean;
  node: boolean;
  edge: boolean;
  ssr: boolean;
  ssg: boolean;
}

export interface DeploymentAdapter {
  name: string;
  capabilities: DeploymentCapabilities;
  prepare(ctx: DeploymentContext): Promise<void>;
  validate(ctx: DeploymentContext): Promise<boolean>;
  bundle(ctx: DeploymentContext): Promise<void>;
  generateManifest(ctx: DeploymentContext): Promise<Record<string, any>>;
  finalize(ctx: DeploymentContext): Promise<void>;
}

export interface DeploymentPlan {
  adapter: string;
  runtimeTargets: string[];
  assets: string[];
  staticFiles: string[];
  serverBundles: string[];
  planTime: number;
}

export interface DeploymentContext {
  projectRoot: string;
  outDir: string;
  adapterName: string;
  dryRun?: boolean;
  planOnly?: boolean;
}
