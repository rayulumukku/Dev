# Official Ray SolidJS Plugin (`@ray/plugin-solid`)

The `@ray/plugin-solid` package provides first-class support for SolidJS components (`.jsx`, `.tsx`, `.solid.tsx`) in Ray bundler applications.

## Features

- **Fine-Grained JSX Compilation**: Compiles Solid JSX templates into fine-grained reactive DOM element creation statements.
- **State-Preserving HMR**: Fast, fine-grained signal-preserving HMR updates.
- **CSS Integration**: Seamless integration with Ray's PostCSS, Tailwind CSS, SASS, and CSS Modules pipeline.
- **SSR & SSG Hydration**: Compiles server-side rendering modules (`renderToString`) for SSG prerendering and Node.js SSR endpoints.
- **Dependency Graph & Cache**: Integrates cleanly with Ray's `DependencyGraph`, persistent cache (`this.cache`), and incremental build engine (`@ray/incremental-build`).

## Installation

```bash
npm install @ray/plugin-solid solid-js --save-dev
```

## Configuration

Configure the plugin in `ray.config.ts`:

```typescript
import { defineConfig } from '@ray/core';
import { solid } from '@ray/plugin-solid';

export default defineConfig({
  plugins: [
    solid({
      dev: true,
      hydratable: true,
      generate: 'dom',
    }),
  ],
});
```

## SSR & SSG Rendering

In SSR or SSG mode (`generate: "ssr"` or production build target), `@ray/plugin-solid` compiles components into server-side rendering functions exporting a `render()` helper:

```typescript
import { App } from './App.jsx';

export function render(props = {}) {
  return {
    html: `<div class="solid-ssr">...</div>`,
    css: '',
  };
}
```

## Troubleshooting

1. **Explicit Solid File Convention**: Use the `.solid.tsx` or `.jsx`/`.tsx` file extensions for Solid components containing JSX templates or signals.
2. **Tailwind CSS Styling**: Process Tailwind utility classes by importing your main CSS file (`import './index.css'`).
