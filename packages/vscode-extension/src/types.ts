export interface ConfigOption {
  key: string;
  type: string;
  description: string;
  default: any;
}

export interface ExtensionSettings {
  cliPath: string;
  autoValidate: boolean;
  diagnosticsSeverity: 'error' | 'warning' | 'info';
}

export interface RayDiagnostic {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}
