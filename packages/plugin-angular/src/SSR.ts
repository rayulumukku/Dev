export class AngularSSRRenderer {
  static compileSSR(code: string, id: string): string {
    return `
${code}

export async function render(props = {}) {
  const html = '<div class="angular-ssr"><app-root></app-root></div>';
  return { html, css: '' };
}
`;
  }
}
