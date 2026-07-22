export function getQualifiedCacheKey(hash: string, namespace?: string): string {
  if (!namespace) return hash;
  return `${namespace}/${hash}`;
}
