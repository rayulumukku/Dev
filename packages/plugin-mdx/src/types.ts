export interface MDXPluginOptions {
  remarkPlugins?: any[];
  rehypePlugins?: any[];
  jsxImportSource?: string;
  providerImportSource?: string;
}

export interface FrontmatterResult {
  data: Record<string, any>;
  content: string;
}

export interface MDXCompileResult {
  code: string;
  frontmatter: Record<string, any>;
  dependencies: string[];
}
