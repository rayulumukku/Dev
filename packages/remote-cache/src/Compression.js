export function compressString(str) {
  return Buffer.from(str).toString('base64');
}

export function decompressString(compressed) {
  return Buffer.from(compressed, 'base64').toString('utf-8');
}
