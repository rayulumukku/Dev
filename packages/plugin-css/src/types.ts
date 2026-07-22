export interface CSSPluginOptions {
  minify?: boolean;
  sourcemap?: boolean;
}

export interface CSSModuleInfo {
  filename: string;
  code: string;
  imports: string[];
  mtime: number;
  hash: string;
}
