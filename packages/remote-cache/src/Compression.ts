export function compressString(str: string): string {
  return Buffer.from(str).toString('base64');
}

export function decompressString(compressed: string): string {
  return Buffer.from(compressed, 'base64').toString('utf-8');
}
