import path from 'path';

export function getWorkspacePackageCacheDir(workspaceRoot, packageName) {
  const safeName = packageName.replace(/[\/@]/g, '_');
  return path.join(workspaceRoot, 'node_modules', '.cache', 'ray', 'workspaces', safeName);
}
