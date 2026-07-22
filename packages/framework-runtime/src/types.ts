export interface FrameworkCapabilities {
  devRuntime?: boolean;
  hmr?: boolean;
  ssr?: boolean;
  ssg?: boolean;
  hydration?: boolean;
  serverComponents?: boolean;
  serverActions?: boolean;
  cssProcessing?: boolean;
  assetHandling?: boolean;
  diagnostics?: boolean;
}

export interface RuntimeContext {
  projectRoot: string;
  mode: string;
  isSSR?: boolean;
  isDev?: boolean;
}

export interface RuntimeHooks {
  transform?: (code: string, id: string) => Promise<{ code: string; map?: any } | null> | { code: string; map?: any } | null;
  renderSSR?: (module: any, props?: any) => Promise<{ html: string; css?: string }> | { html: string; css?: string };
  onHMRUpdate?: (file: string) => void;
  onDiagnostics?: (id: string, code: string) => any[];
  generateManifest?: () => Record<string, any>;
}

export interface FrameworkAdapter {
  name: string;
  version: string;
  capabilities: FrameworkCapabilities;
  hooks?: RuntimeHooks;
}
