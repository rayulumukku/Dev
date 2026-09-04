import { BundlerAdapter, RawMetrics } from '../types.js';

export abstract class BaseAdapter implements BundlerAdapter {
  abstract name: string;
  abstract version: string;

  async setup(workspaceDir: string): Promise<void> {}
  abstract runBuild(workspaceDir: string): Promise<RawMetrics>;
  async cleanup?(workspaceDir: string): Promise<void> {}

  startDevServer?(workspaceDir: string): Promise<void>;
  measureHMR?(workspaceDir: string, filePath: string): Promise<number>;
}
