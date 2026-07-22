export type ModuleBoundaryType = 'server' | 'client' | 'shared';

export interface ClientReference {
  id: string;
  name: string;
  chunks: string[];
  async: boolean;
}

export type ClientReferenceManifest = Record<string, Record<string, ClientReference>>;

export interface FlightPayload {
  id: string;
  type: 'component' | 'client-ref' | 'element';
  data: any;
}

export interface RSCOptions {
  enabled?: boolean;
  experimental?: boolean;
  manifestPath?: string;
}

export interface RSCCompileResult {
  code: string;
  boundary: ModuleBoundaryType;
  map?: any;
  dependencies: string[];
}
