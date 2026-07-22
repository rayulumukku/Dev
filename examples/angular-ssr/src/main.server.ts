import { AppComponent } from './app/app.component.js';

export async function render(props = {}) {
  const html = `<div class="angular-ssr"><app-root></app-root></div>`;
  return { html, css: '' };
}
