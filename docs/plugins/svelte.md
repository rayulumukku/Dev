# Official Ray Svelte Plugin (`@ray/plugin-svelte`)

The `@ray/plugin-svelte` package provides first-class support for Svelte Single File Components (`.svelte`) in Ray bundler applications.

## Features

- **`.svelte` Component Compilation**: Compiles script, template, and style blocks into JavaScript modules.
- **State-Preserving HMR**: Fast, state-preserving updates for component templates, styles, and scripts.
- **CSS Integration**: Integrates directly with Ray's PostCSS, Tailwind CSS, SASS, and CSS Modules pipeline.
- **SSR & SSG Support**: Compiles server-side rendering modules (`render(props)`) for SSG prerendering and Node.js SSR endpoints.
- **Dependency Graph & Cache**: Participates in Ray's `DependencyGraph`, persistent cache (`this.cache`), and incremental build engine (`@ray/incremental-build`).

## Installation

```bash
npm install @ray/plugin-svelte svelte --save-dev
```

## Configuration

Configure the plugin in `ray.config.ts`:

```typescript
import { defineConfig } from '@ray/core';
import { svelte } from '@ray/plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        dev: true,
        hydratable: true,
      },
    }),
  ],
});
```

## SSR & SSG Rendering

In SSR or SSG mode (`options.isServer` or production build target), `@ray/plugin-svelte` compiles components into server-side renderer objects exporting a `render()` function:

```typescript
import App from './App.svelte';

export function render(props = {}) {
  const result = (App as any).render(props);
  return {
    html: result.html,
    css: result.css ? result.css.code : '',
  };
}
```

## Troubleshooting

1. **Unresolved Component Imports**: Ensure `.svelte` extensions are specified in relative import paths (`import Header from './Header.svelte'`).
2. **Tailwind CSS Styling**: Process Tailwind utility classes by importing your main CSS file (`import './index.css'`).
