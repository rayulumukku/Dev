export function serializeEntry(entry) {
  return JSON.stringify(entry);
}

export function deserializeEntry(raw) {
  return JSON.parse(raw);
}
