export interface SSRConfig {
  enabled?: boolean;
  entry?: string;
  clientEntry?: string;
  streaming?: boolean;
  external?: string[];
  noExternal?: string[];
}

export interface SSRRenderOptions {
  url: string;
  initialData?: Record<string, any>;
  template?: string;
}

export interface SSRRenderResult {
  html: string;
  head?: string[];
  status?: number;
  initialData?: Record<string, any>;
}

export interface SSRManifest {
  [moduleId: string]: string[];
}
