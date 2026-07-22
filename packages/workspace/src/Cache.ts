import path from 'path';

export function getWorkspacePackageCacheDir(workspaceRoot: string, packageName: string): string {
  const safeName = packageName.replace(/[\/@]/g, '_');
  return path.join(workspaceRoot, 'node_modules', '.cache', 'ray', 'workspaces', safeName);
}
