export interface SassCompilerOptions {
  indentedSyntax?: boolean;
  loadPaths?: string[];
  sourcemap?: boolean;
}

export interface SassCompileResult {
  css: string;
  loadedUrls: string[];
  map?: any;
}
