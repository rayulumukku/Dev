import { BundlerAdapter, RawMetrics } from '../types.js';

export abstract class BaseAdapter implements BundlerAdapter {
  abstract name: string;
  abstract version: string;

  async setup(workspaceDir: string): Promise<void> {}
  abstract runBuild(workspaceDir: string): Promise<RawMetrics>;
  async cleanup?(workspaceDir: string): Promise<void> {}

  abstract startDevServer?(workspaceDir: string): Promise<void>;
  abstract measureHMR?(workspaceDir: string, filePath: string): Promise<number>;
}
