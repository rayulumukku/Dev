import { Resolver } from '../resolver/index.js';
import { DependencyGraph } from '../graph/index.js';

export interface TransformResult {
  code: string;
  map?: any;
}

export interface PluginContext {
  projectRoot: string;
  resolver: Resolver;
  graph: DependencyGraph;
  logger: Console;
  buildMode: 'development' | 'production';
  devServer?: any;
  watcher?: any;
  websocket?: any;
  emitFile(name: string, content: string | Buffer): void;
  addWatchFile(file: string): void;
  resolveId(id: string, importer?: string): Promise<string | null>;
  cacheStore?: any;
  cache?: {
    get(key: string): any;
    set(key: string, val: any): void;
    invalidate(key: string): void;
  };
}

export interface RayPlugin {
  name: string;
  enforce?: 'pre' | 'post';
  config?(config: any): void | Promise<void>;
  configResolved?(config: any): void | Promise<void>;
  resolveId?(this: PluginContext, id: string, importer?: string): Promise<string | null> | string | null;
  load?(this: PluginContext, id: string): Promise<string | null> | string | null;
  transform?(this: PluginContext, code: string, id: string): Promise<TransformResult | string | null> | TransformResult | string | null;
  handleHotUpdate?(this: PluginContext, ctx: { file: string; timestamp: number }): Promise<void> | void;
  buildStart?(this: PluginContext): Promise<void>;
  buildEnd?(this: PluginContext): Promise<void>;
  generateBundle?(this: PluginContext, bundle: any): Promise<void>;
  closeBundle?(this: PluginContext): Promise<void>;
}

export interface LibraryConfig {
  entry: string;
  name: string;
  formats?: ('esm' | 'cjs' | 'umd' | 'iife')[];
  fileName?: string | ((format: string) => string);
  external?: string[];
  dts?: boolean;
}

export interface BuildConfig {
  lib?: LibraryConfig;
  banner?: string;
  footer?: string;
  outDir?: string;
  minify?: boolean;
  sourcemap?: string | boolean;
  watch?: boolean;
  analyze?: boolean;
}

export interface RayConfig {
  plugins?: RayPlugin[];
  build?: BuildConfig;
}

export function defineConfig(config: RayConfig) {
  return config;
}
