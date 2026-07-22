export interface PluginVersionSpec {
  minRayVersion?: string;
  maxRayVersion?: string;
  testedRayVersions?: string[];
}

export interface PluginMeta {
  name: string;
  version?: string;
  description?: string;
  author?: string;
  compatibility?: PluginVersionSpec;
  schema?: Record<string, any>;
}

export interface SDKPluginContext {
  projectRoot: string;
  buildMode: 'development' | 'production';
  logger: SDKLogger;
  emitFile(name: string, content: string | Buffer): void;
  addWatchFile(file: string): void;
  resolveId(id: string, importer?: string): Promise<string | null>;
  load?(id: string): Promise<string | null>;
  cache?: {
    get(key: string): any;
    set(key: string, val: any): void;
    invalidate(key: string): void;
  };
}

export interface SDKLogger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  debug(msg: string): void;
}

export interface DiagnosticItem {
  type: 'warning' | 'error' | 'info';
  code: string;
  message: string;
  location?: { file: string; line?: number; column?: number };
}

export interface ValidationReport {
  valid: boolean;
  pluginName: string;
  errors: string[];
  warnings: string[];
  compatibility: { ok: boolean; reason?: string };
}
