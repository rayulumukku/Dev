import path from 'path';

export function buildInspectorNode(filePath, isEntry = false, transformTimeMs = 0) {
  const normalized = filePath.replace(/\\/g, '/');
  const ext = path.extname(filePath).toLowerCase();
  let type = 'js';

  if (normalized.includes('packages/')) {
    type = 'workspace';
  } else if (ext === '.ts' || ext === '.tsx') {
    type = ext === '.tsx' ? 'react' : 'ts';
  } else if (ext === '.jsx') {
    type = 'react';
  } else if (ext === '.vue') {
    type = 'vue';
  } else if (ext === '.css' || ext === '.scss' || ext === '.sass') {
    type = 'css';
  } else if (['.png', '.jpg', '.svg', '.json'].includes(ext)) {
    type = 'asset';
  }

  return {
    id: filePath,
    label: path.basename(filePath),
    type,
    isEntry,
    transformTimeMs,
  };
}
