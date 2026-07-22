export interface SSGConfig {
  enabled?: boolean;
  routes?: string[];
  sitemap?: boolean;
  robots?: boolean;
  minifyHTML?: boolean;
  outDir?: string;
}

export interface SSGRoute {
  path: string;
  outputPath: string;
}

export interface SSGPrerenderResult {
  route: string;
  html: string;
  error?: Error;
}

export interface SitemapOptions {
  domain?: string;
  routes: string[];
}
