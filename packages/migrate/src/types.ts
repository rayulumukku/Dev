export type FrameworkType = 'vite' | 'webpack';

export interface DetectedConfig {
  type: FrameworkType;
  path: string;
}

export interface ConfigEnv {
  command: string;
  mode: string;
}

export interface LoadConfigResult {
  config: Record<string, any>;
  framework: FrameworkType;
  configPath: string;
}
