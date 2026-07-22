export type StabilityLevel = 'public' | 'experimental' | 'deprecated' | 'internal';
export type ChangeSeverity = 'patch-safe' | 'minor-safe' | 'major-required';

export interface APISymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'variable' | 'type';
  stability: StabilityLevel;
  signature?: string;
  deprecationNotice?: string;
  replacement?: string;
}

export interface APIManifest {
  packageName: string;
  symbols: APISymbol[];
  scannedAt: number;
}

export interface APIDiff {
  packageName: string;
  added: APISymbol[];
  removed: APISymbol[];
  modified: { symbol: APISymbol; oldSignature?: string; newSignature?: string; severity: ChangeSeverity }[];
}
