import { App } from './App.js';

export function render(props = {}) {
  const html = `<div class="solid-ssr"><h1>Solid SSR</h1></div>`;
  return { html, css: '' };
}
