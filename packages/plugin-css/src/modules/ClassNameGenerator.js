import path from 'path';

export function generateScopedClassName(name, filename, isProduction = false) {
  const fileBaseName = path.basename(filename, '.module.css');
  let hash = 0;
  for (let i = 0; i < (filename + name).length; i++) {
    hash = (hash << 5) - hash + (filename + name).charCodeAt(i);
    hash |= 0;
  }
  const hashStr = Math.abs(hash).toString(36).slice(0, 5);

  if (isProduction) {
    return `_${hashStr}`;
  }
  return `${fileBaseName}_${name}__${hashStr}`;
}
