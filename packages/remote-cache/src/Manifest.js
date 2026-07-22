export function getQualifiedCacheKey(hash, namespace) {
  if (!namespace) return hash;
  return `${namespace}/${hash}`;
}
