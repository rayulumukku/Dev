export interface AngularPluginOptions {
  aot?: boolean;
  optimization?: boolean;
  strictTemplates?: boolean;
  tsconfig?: string;
  isServer?: boolean;
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
}

export interface AngularCompileResult {
  code: string;
  map?: any;
  dependencies: string[];
}

export interface AngularWorkspaceConfig {
  version: number;
  projects: Record<string, {
    root: string;
    sourceRoot?: string;
    projectType?: 'application' | 'library';
    architect?: Record<string, any>;
  }>;
}
