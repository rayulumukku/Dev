export interface VuePluginOptions {
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
  isProduction?: boolean;
}

export interface SFCDescriptor {
  filename: string;
  source: string;
  script?: {
    content: string;
    lang?: string;
    setup?: boolean;
  };
  template?: {
    content: string;
    lang?: string;
  };
  styles: Array<{
    content: string;
    scoped?: boolean;
    lang?: string;
  }>;
  customBlocks: Array<{
    type: string;
    content: string;
  }>;
}

export interface SFCCompileResult {
  code: string;
  map?: any;
}
