export function resolveVueId(id, importer) {
  if (id.endsWith('.vue')) {
    return id;
  }
  return null;
}
