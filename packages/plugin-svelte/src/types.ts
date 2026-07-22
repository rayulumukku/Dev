export interface SveltePluginOptions {
  compilerOptions?: Record<string, any>;
  include?: string | RegExp | (string | RegExp)[];
  exclude?: string | RegExp | (string | RegExp)[];
  emitCss?: boolean;
  isServer?: boolean;
}

export interface SvelteDescriptor {
  script?: { code: string };
  template: { code: string };
  style?: { code: string };
}

export interface SvelteCompileResult {
  js: { code: string; map?: any };
  css?: { code: string; map?: any };
  dependencies: string[];
}
