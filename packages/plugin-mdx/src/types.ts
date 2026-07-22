export interface MDXPluginOptions {
  remarkPlugins?: any[];
  rehypePlugins?: any[];
  jsxImportSource?: string;
  providerImportSource?: string;
  filepath?: string;
}

export interface FrontmatterResult {
  data: Record<string, any>;
  content: string;
}

export interface MDXCompileResult {
  code: string;
  map?: any;
  frontmatter: Record<string, any>;
  dependencies: string[];
}
