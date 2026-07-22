import App from './App.svelte';

export function render(props = {}) {
  const result = (App as any).render(props);
  return {
    html: result.html,
    css: result.css ? result.css.code : '',
  };
}
