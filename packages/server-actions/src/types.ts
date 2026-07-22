export interface ServerAction {
  id: string;
  name: string;
  filepath: string;
  handler?: (...args: any[]) => any;
  boundArgs?: any[];
}

export interface ServerActionsConfig {
  enabled?: boolean;
  experimental?: boolean;
  maxPayloadSize?: string;
  csrfProtection?: boolean;
}

export interface ActionInvocationResult {
  success: boolean;
  result?: any;
  error?: string;
  actionId: string;
  durationMs: number;
}

export type ServerActionsManifest = Record<string, {
  id: string;
  name: string;
  filepath: string;
}>;
