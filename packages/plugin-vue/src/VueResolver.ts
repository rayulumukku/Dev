export function resolveVueId(id: string, importer?: string): string | null {
  if (id.endsWith('.vue')) {
    return id;
  }
  return null;
}
