export type WorkspaceManagerType = 'pnpm' | 'npm' | 'yarn' | 'bun' | 'none';

export interface WorkspacePackageInfo {
  name: string;
  version: string;
  location: string;
  manifestPath: string;
  dependencies: string[];
}

export interface WorkspaceGraphNode {
  packageInfo: WorkspacePackageInfo;
  dependencies: string[];
  dependents: string[];
}

export interface WorkspaceConfig {
  root: string;
  manager: WorkspaceManagerType;
  packages: Map<string, WorkspacePackageInfo>;
}
