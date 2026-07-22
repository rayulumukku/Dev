export function generateHydrationScript(initialData) {
  if (!initialData) return '';
  const serialized = JSON.stringify(initialData).replace(/</g, '\\u003c');
  return `<script>window.__INITIAL_DATA__ = ${serialized};</script>`;
}
