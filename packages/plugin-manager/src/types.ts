export interface LockfileEntry {
  version: string;
  integrity: string;
  source: string;
  sdk: string;
  resolvedAt: number;
}

export interface LockfileData {
  lockfileVersion: number;
  plugins: Record<string, LockfileEntry>;
}

export interface DoctorIssue {
  type: 'error' | 'warning';
  plugin: string;
  code: string;
  message: string;
}

export interface DoctorReport {
  healthy: boolean;
  issues: DoctorIssue[];
}

export interface InstallOptions {
  projectRoot?: string;
  source?: 'npm' | 'local' | 'catalog';
}

export interface PublishOptions {
  dryRun?: boolean;
}
