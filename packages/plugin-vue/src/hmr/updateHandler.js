export function handleVueUpdate(payload) {
  switch (payload.type) {
    case 'style-only':
      return { action: 'reload-styles', file: payload.file };
    case 'template-only':
      return { action: 'rerender', file: payload.file };
    case 'script-only':
    case 'multiple':
    default:
      return { action: 'reload-module', file: payload.file };
  }
}
