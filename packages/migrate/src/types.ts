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

export interface RayConfig {
  root?: string;
  base?: string;
  publicDir?: string;
  resolve?: {
    alias?: Record<string, string>;
  };
  server?: {
    host?: string | boolean;
    port?: number;
    open?: boolean;
  };
  build?: {
    outDir?: string;
    assetsDir?: string;
    sourcemap?: boolean;
    minify?: boolean;
  };
  define?: Record<string, string>;
  envPrefix?: string | string[];
  plugins?: unknown[];
}
