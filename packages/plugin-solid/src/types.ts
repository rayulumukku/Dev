export interface SolidPluginOptions {
  dev?: boolean;
  hydratable?: boolean;
  generate?: 'dom' | 'ssr';
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
}

export interface SolidCompileResult {
  code: string;
  map?: any;
  dependencies: string[];
}
