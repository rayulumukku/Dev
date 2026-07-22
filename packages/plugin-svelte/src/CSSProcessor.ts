export class SvelteCSSProcessor {
  static processStyle(css: string, componentId: string): string {
    if (!css.trim()) return '';

    return `
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.setAttribute('data-svelte-component', ${JSON.stringify(componentId)});
  style.innerHTML = ${JSON.stringify(css)};
  document.head.appendChild(style);
}
`;
  }
}
