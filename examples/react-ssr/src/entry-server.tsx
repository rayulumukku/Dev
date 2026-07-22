import { App } from './App.js';

export function render(url: string) {
  return {
    html: '<div><h1>Ray React SSR App</h1></div>',
    head: ['<title>Ray React SSR</title>'],
    initialData: { url },
  };
}
